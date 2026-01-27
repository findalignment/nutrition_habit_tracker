import { z } from 'zod'

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

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type CheckInAnswersInput = z.infer<typeof checkInAnswersSchema>
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>
export type UpdateCheckInInput = z.infer<typeof updateCheckInSchema>
