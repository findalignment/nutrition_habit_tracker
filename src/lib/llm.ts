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
      content: getSystemPrompt(user),
    },
    {
      role: 'user',
      content: await buildUserPrompt(checkIn, user),
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
        return await callLLM('Fix to schema.')
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

function getSystemPrompt(user: User & { goal: Goal | null }): string {
  const goalContext = user.goal
    ? `The user's current goal is: "${user.goal.name}" - ${user.goal.description}`
    : 'The user is working on general nutrition habits.'

  const preferences = user.preferences as any || {}
  const tone = preferences.tone || 'supportive'
  const dietary = []
  if (preferences.vegetarian) dietary.push('vegetarian')
  if (preferences.vegan) dietary.push('vegan')
  const dietaryContext = dietary.length > 0 ? `They follow a ${dietary.join(', ')} diet.` : ''

  return `You are a nutrition habit coach. ${goalContext} ${dietaryContext}

Your tone should be ${tone}. 

Analyze the user's check-in and return ONLY valid JSON matching this exact schema:

{
  "type": "checkin_feedback",
  "habit_score": {
    "protein": "missing" | "partial" | "ok",
    "plants": "missing" | "partial" | "ok",
    "liquid_calories": "unknown" | "low" | "medium" | "high",
    "snacks": "unknown" | "low" | "medium" | "high",
    "timing": "unknown" | "ok" | "needs_attention"
  },
  "feedback_short": "2-3 encouraging sentences (max 300 chars)",
  "one_action": "One specific actionable tip (max 120 chars)",
  "confidence": "low" | "medium" | "high",
  "flags": {
    "needs_clarification": boolean,
    "safety_escalation": boolean,
    "flag_reasons": ["reason1", "reason2"] // optional, max 5 items of 80 chars
  },
  "assumptions": ["assumption1", "assumption2"], // max 6 items of 120 chars
  "optional_question": "One clarifying question if needed (max 120 chars)" // optional
}

Be concise, specific, and actionable.`
}

async function buildUserPrompt(
  checkIn: CheckIn & { photos: CheckInPhoto[]; answers: CheckInAnswers | null },
  user: User
): Promise<string> {
  let prompt = `Check-in for ${checkIn.mealType} on ${checkIn.date}.\n`

  if (checkIn.notes) {
    prompt += `\nUser notes: "${checkIn.notes}"\n`
  }

  if (checkIn.answers) {
    prompt += `\nAnswers:\n`
    if (checkIn.answers.drinksCalories) prompt += `- Drinks with calories: ${checkIn.answers.drinksCalories}\n`
    if (checkIn.answers.alcohol) prompt += `- Alcohol: ${checkIn.answers.alcohol}\n`
    if (checkIn.answers.snacks) prompt += `- Snacks: ${checkIn.answers.snacks}\n`
    if (checkIn.answers.cookingTastes) prompt += `- Cooking tastes good: ${checkIn.answers.cookingTastes}\n`
    if (checkIn.answers.supplements) prompt += `- Supplements: ${checkIn.answers.supplements}\n`
    if (checkIn.answers.missedMeals) prompt += `- Missed meals: ${checkIn.answers.missedMeals}\n`
    if (checkIn.answers.hungerLevel) prompt += `- Hunger level: ${checkIn.answers.hungerLevel}/5\n`
    if (checkIn.answers.stressLevel) prompt += `- Stress level: ${checkIn.answers.stressLevel}/5\n`
  }

  if (checkIn.photos.length > 0) {
    prompt += `\n[Photos provided - analyze the meal in the image(s)]\n`
    // Note: In production, you'd send the actual images to GPT-4 Vision
  }

  return prompt
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
