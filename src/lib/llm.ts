import OpenAI from 'openai'
import type { CheckIn, CheckInAnswers, CheckInPhoto, Goal, User } from '@prisma/client'
import { checkUserInputSafety, getSafeResponse } from './safety'
import type { HabitScore } from './scoring'

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

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(responseText)

    return {
      habitScore: result.habitScore || { protein: 5, plants: 5, liquids: 5, snacks: 5, training: 5 },
      feedbackShort: result.feedbackShort || 'Keep building those habits!',
      oneAction: result.oneAction || 'Focus on one small improvement tomorrow.',
      confidence: result.confidence || 'med',
      flags: result.flags,
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

Analyze the user's check-in and provide:
1. habitScore: JSON object with keys: protein (0-10), plants (0-10), liquids (0-10), snacks (0-10), training (0-10)
2. feedbackShort: 2-3 sentence encouraging feedback
3. oneAction: One specific actionable tip for their next meal
4. confidence: "low", "med", or "high" based on available info
5. flags: optional object with possibleED, medical, or unsafe boolean flags

Return ONLY valid JSON with these exact keys.`
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
