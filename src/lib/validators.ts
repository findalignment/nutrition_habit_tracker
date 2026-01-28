import { z } from 'zod'

// Existing schemas
export const onboardingSchema = z.object({
  goalId: z.string().min(1, 'Please select a goal'),
  timezone: z.string().min(1),
  preferences: z.object({
    tone: z.enum(['supportive', 'direct', 'scientific']).default('supportive'),
    vegetarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    allergies: z.array(z.string()).default([]),
    noCalorieEstimates: z.boolean().default(false),
  }),
})

export const checkInAnswersSchema = z.object({
  drinksCalories: z.enum(['yes', 'no', 'unsure']).optional(),
  alcohol: z.enum(['yes', 'no']).optional(),
  snacks: z.enum(['yes', 'no']).optional(),
  cookingTastes: z.enum(['yes', 'no']).optional(),
  supplements: z.enum(['yes', 'no']).optional(),
  missedMeals: z.enum(['yes', 'no']).optional(),
  hungerLevel: z.number().min(1).max(5).optional(),
  stressLevel: z.number().min(1).max(5).optional(),
})

export const createCheckInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'full-day']),
  notes: z.string().optional(),
  photoUrls: z.array(z.string().url()).default([]),
  answers: checkInAnswersSchema,
})

export const updateCheckInSchema = z.object({
  notes: z.string().optional(),
  answers: checkInAnswersSchema.optional(),
})

// AI Response schemas - Mirror JSON schema exactly
export const checkInFeedbackSchema = z.object({
  type: z.literal('checkin_feedback'),
  habit_score: z.object({
    protein: z.enum(['missing', 'partial', 'ok']),
    plants: z.enum(['missing', 'partial', 'ok']),
    liquid_calories: z.enum(['unknown', 'low', 'medium', 'high']),
    snacks: z.enum(['unknown', 'low', 'medium', 'high']),
    timing: z.enum(['unknown', 'ok', 'needs_attention']),
  }),
  feedback_short: z.string().max(300),
  one_action: z.string().max(120),
  confidence: z.enum(['low', 'medium', 'high']),
  flags: z.object({
    needs_clarification: z.boolean(),
    safety_escalation: z.boolean(),
    flag_reasons: z.array(z.string().max(80)).max(5).optional(),
  }),
  assumptions: z.array(z.string().max(120)).max(6),
  optional_question: z.string().max(120).optional(),
}).strict()

export const decisionCoachSchema = z.object({
  type: z.literal('decision_coach'),
  recommended: z.object({
    title: z.string().max(60),
    steps: z.array(z.string().max(100)).min(1).max(4),
    drink: z.string().max(60).optional(),
  }).strict(),
  options: z.array(
    z.object({
      title: z.string().max(60),
      steps: z.array(z.string().max(100)).min(1).max(4),
    }).strict()
  ).min(1).max(3),
  fallback: z.string().max(120),
  why_short: z.string().max(220),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(z.string().max(120)).max(6),
  flags: z.object({
    needs_clarification: z.boolean(),
    safety_escalation: z.boolean(),
    flag_reasons: z.array(z.string().max(80)).max(5).optional(),
  }),
  optional_question: z.string().max(120).optional(),
}).strict()

// Type exports
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type CheckInAnswersInput = z.infer<typeof checkInAnswersSchema>
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>
export type UpdateCheckInInput = z.infer<typeof updateCheckInSchema>
export type CheckInFeedback = z.infer<typeof checkInFeedbackSchema>
export type DecisionCoach = z.infer<typeof decisionCoachSchema>

// Helper function to validate and retry LLM responses
export async function validateLLMResponse<T>(
  schema: z.ZodSchema<T>,
  response: unknown,
  retryFn?: () => Promise<unknown>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = schema.parse(response)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError && retryFn) {
      // Single automatic retry with "Fix to schema" instruction
      console.warn('LLM response validation failed, retrying...', error.errors)
      
      try {
        const retryResponse = await retryFn()
        const validated = schema.parse(retryResponse)
        return { success: true, data: validated }
      } catch (retryError) {
        return {
          success: false,
          error: retryError instanceof z.ZodError
            ? `Validation failed after retry: ${retryError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
            : 'Retry failed'
        }
      }
    }
    
    return {
      success: false,
      error: error instanceof z.ZodError
        ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Validation failed'
    }
  }
}
