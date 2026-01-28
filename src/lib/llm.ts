import OpenAI from 'openai'
import type { CheckIn, CheckInAnswers, CheckInPhoto, Goal, User } from '@prisma/client'
import { checkUserInputSafety, getSafeResponse } from './safety'
import type { HabitScore } from './scoring'
import { checkInFeedbackSchema, validateLLMResponse, type CheckInFeedback } from './validators'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AnalyzeCheckInInput {
  checkIn: CheckIn & {
    photos: CheckInPhoto[]
    answers: CheckInAnswers | null
  }
  user: User & {
    goal: Goal | null
  }
  recentCheckIns?: (CheckIn & { aiResult: any | null })[]
}

export interface AnalyzeCheckInResult {
  habitScore: HabitScore
  feedbackShort: string
  oneAction: string
  confidence: 'low' | 'med' | 'high'
  flags?: {
    possibleED?: boolean
    medical?: boolean
    unsafe?: boolean
  }
}

export async function analyzeCheckIn(
  input: AnalyzeCheckInInput
): Promise<AnalyzeCheckInResult> {
  const { checkIn, user } = input

  // Safety check on notes
  if (checkIn.notes) {
    const safetyCheck = checkUserInputSafety(checkIn.notes)
    if (!safetyCheck.isSafe && safetyCheck.shouldBlockResponse) {
      return {
        habitScore: { protein: 0, plants: 0, liquids: 0, snacks: 0, training: 0 },
        feedbackShort: getSafeResponse(safetyCheck.flag),
        oneAction: 'Please seek support from a qualified professional.',
        confidence: 'high',
        flags: {
          possibleED: safetyCheck.flag === 'eating_disorder',
          medical: safetyCheck.flag === 'medical',
          unsafe: true,
        },
      }
    }
  }

  const hasPhotos = checkIn.photos.length > 0
  const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial'

  // Free users don't get photo analysis
  if (hasPhotos && !isPro) {
    return getTextOnlyFeedback(checkIn, user)
  }

  // Build the analysis prompt
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: getSystemPrompt(),
    },
    {
      role: 'user',
      content: await buildUserPrompt(checkIn, user, input.recentCheckIns),
    },
  ]

  // Function to call LLM with optional retry instruction
  const callLLM = async (retryInstruction?: string) => {
    const finalMessages = retryInstruction
      ? [...messages, { role: 'user' as const, content: retryInstruction }]
      : messages

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: finalMessages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(responseText)
  }

  try {
    // First attempt
    const response = await callLLM()
    
    // Validate with automatic retry on failure
    const validation = await validateLLMResponse(
      checkInFeedbackSchema,
      response,
      async () => {
        console.log('Retrying LLM call with schema fix instruction...')
        return await callLLM('Fix the output to match the schema exactly. Do not change content unless required for validity.')
      }
    )

    if (!validation.success) {
      console.error('LLM validation failed:', validation.error)
      throw new Error(validation.error)
    }

    // Map validated response to return format
    const data = validation.data
    return {
      habitScore: convertHabitScore(data.habit_score),
      feedbackShort: data.feedback_short,
      oneAction: data.one_action,
      confidence: data.confidence === 'medium' ? 'med' : data.confidence,
      flags: {
        possibleED: data.flags.safety_escalation,
        medical: data.flags.safety_escalation,
        unsafe: data.flags.safety_escalation,
      },
    }
  } catch (error) {
    console.error('LLM analysis error:', error)
    
    // Fallback response
    return {
      habitScore: { protein: 5, plants: 5, liquids: 5, snacks: 5, training: 5 },
      feedbackShort: 'Thanks for checking in! Keep building your habits.',
      oneAction: 'Try to include more variety in your next meal.',
      confidence: 'low',
    }
  }
}

// Helper to convert new habit score format to legacy format
function convertHabitScore(score: CheckInFeedback['habit_score']): HabitScore {
  const toNumber = (value: string): number => {
    if (value === 'ok') return 8
    if (value === 'partial') return 5
    if (value === 'missing') return 2
    if (value === 'low') return 8
    if (value === 'medium') return 5
    if (value === 'high') return 2
    return 5 // unknown
  }

  return {
    protein: toNumber(score.protein),
    plants: toNumber(score.plants),
    liquids: 10 - toNumber(score.liquid_calories), // inverse
    snacks: 10 - toNumber(score.snacks), // inverse
    training: score.timing === 'ok' ? 8 : score.timing === 'needs_attention' ? 3 : 5,
  }
}

function getSystemPrompt(): string {
  // Load system prompt from file
  const fs = require('fs')
  const path = require('path')
  const systemPromptPath = path.join(process.cwd(), 'src/lib/prompts/system.md')
  const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8')
  
  return systemPrompt
}

async function buildUserPrompt(
  checkIn: CheckIn & { photos: CheckInPhoto[]; answers: CheckInAnswers | null },
  user: User & { goal: Goal | null },
  recentCheckIns?: (CheckIn & { aiResult: any | null })[]
): Promise<string> {
  // Assemble user message dynamically following the specified structure
  
  // USER GOAL
  const goalSection = user.goal
    ? `USER GOAL:\n${user.goal.name} — ${user.goal.description}\n`
    : `USER GOAL:\nGeneral nutrition habits\n`

  // USER PREFERENCES
  const preferences = user.preferences as any || {}
  const tone = preferences.tone || 'supportive'
  const dietary = []
  if (preferences.vegetarian) dietary.push('vegetarian')
  if (preferences.vegan) dietary.push('vegan')
  if (preferences.noCalorieEstimates) dietary.push('no calorie estimates')
  const allergies = preferences.allergies?.length > 0 ? `Allergies: ${preferences.allergies.join(', ')}` : ''
  
  const preferencesSection = `USER PREFERENCES:\nTone: ${tone}\n${dietary.length > 0 ? `Dietary: ${dietary.join(', ')}\n` : ''}${allergies ? allergies + '\n' : ''}`

  // RECENT CONTEXT (last 3 days summary)
  let recentContextSection = ''
  if (recentCheckIns && recentCheckIns.length > 0) {
    const recentPatterns = recentCheckIns
      .slice(0, 3)
      .map(c => {
        const score = c.aiResult?.habitScore
        const feedback = c.aiResult?.feedbackShort
        return `${c.date} (${c.mealType}): ${feedback ? feedback.substring(0, 80) : 'No feedback'}`
      })
      .join('\n')
    
    recentContextSection = `RECENT CONTEXT (last 3 days summary):\n${recentPatterns}\n\n`
  }

  // TODAY'S CHECK-IN DATA
  let photoDescriptions = 'None'
  if (checkIn.photos.length > 0) {
    photoDescriptions = `${checkIn.photos.length} photo(s) provided`
    // Note: In production, send actual images to GPT-4 Vision
  }

  const answers = checkIn.answers
    ? Object.entries(checkIn.answers)
        .filter(([key, value]) => value !== null && key !== 'id' && key !== 'checkInId' && key !== 'createdAt')
        .map(([key, value]) => `  ${key}: ${value}`)
        .join('\n')
    : 'None provided'

  const notes = checkIn.notes || 'None'
  
  const todaySection = `TODAY'S CHECK-IN DATA:
Date: ${checkIn.date}
Meal type: ${checkIn.mealType}
Photos: ${photoDescriptions}
Answers:
${answers}
Notes: ${notes}
`

  // TASK INSTRUCTION
  const taskSection = `TASK:
Generate a response following the checkin_feedback schema.`

  // STRICT OUTPUT INSTRUCTION
  const schemaEnforcement = `
Return ONLY valid JSON that matches the \`checkin_feedback\` schema exactly.

Rules:
- Do not include explanations
- Do not include markdown
- Do not include text outside JSON
- Do not add fields
- Do not rename fields
- Keep all strings within length limits

If unsure, make reasonable assumptions and list them in \`assumptions\`.

If you violate the schema, the response will be rejected.`

  // Assemble final prompt
  return `${goalSection}\n${preferencesSection}\n${recentContextSection}${todaySection}\n${taskSection}\n${schemaEnforcement}`
}

function getTextOnlyFeedback(
  checkIn: CheckIn & { photos: CheckInPhoto[]; answers: CheckInAnswers | null },
  user: User
): AnalyzeCheckInResult {
  return {
    habitScore: { protein: 5, plants: 5, liquids: 5, snacks: 5, training: 5 },
    feedbackShort: 'Thanks for checking in! Upgrade to Pro to get photo-based feedback and personalized insights.',
    oneAction: 'Consider tracking more details about your meals for better insights.',
    confidence: 'low',
  }
}

// Weekly summary generation
export async function generateWeeklySummary(
  checkIns: (CheckIn & { aiResult: any | null })[],
  user: User & { goal: Goal | null }
): Promise<{
  summary: string
  pattern: string
  nextWeekFocus: string
}> {
  const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial'
  
  if (!isPro) {
    return {
      summary: 'Weekly summaries are available with Pro subscription.',
      pattern: 'Upgrade to unlock pattern analysis.',
      nextWeekFocus: 'Get personalized weekly insights with Pro.',
    }
  }

  // Build weekly context
  const weekContext = checkIns.map(c => {
    const score = c.aiResult?.habitScore
    return `${c.date} (${c.mealType}): Score: ${score ? JSON.stringify(score) : 'N/A'}`
  }).join('\n')

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a nutrition habit coach creating a weekly summary. Be encouraging and specific.`,
    },
    {
      role: 'user',
      content: `Here are the user's check-ins from this week:\n\n${weekContext}\n\nProvide a JSON response with:\n1. summary: 2-3 sentences about their week\n2. pattern: One key pattern you noticed\n3. nextWeekFocus: One specific focus for next week`,
    },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
    
    return {
      summary: result.summary || 'Great work this week!',
      pattern: result.pattern || 'Keep building consistency.',
      nextWeekFocus: result.nextWeekFocus || 'Focus on one habit at a time.',
    }
  } catch (error) {
    console.error('Weekly summary error:', error)
    return {
      summary: 'Thanks for checking in this week!',
      pattern: 'Building consistency is key.',
      nextWeekFocus: 'Keep up the momentum next week.',
    }
  }
}
