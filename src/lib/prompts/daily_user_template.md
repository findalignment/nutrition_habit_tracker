# Daily Check-In Analysis Template

## User Context
- **Goal**: {{goal_name}} - {{goal_description}}
- **Dietary Preferences**: {{dietary_preferences}}
- **Timezone**: {{timezone}}
- **Tone Preference**: {{tone}}

## Today's Check-In
- **Date**: {{date}}
- **Meal Type**: {{meal_type}}
- **Notes**: {{user_notes}}

## Answers Provided
{{#if drinks_calories}}- Drinks with calories: {{drinks_calories}}{{/if}}
{{#if alcohol}}- Alcohol: {{alcohol}}{{/if}}
{{#if snacks}}- Snacked: {{snacks}}{{/if}}
{{#if cooking_tastes}}- Cooking tastes good: {{cooking_tastes}}{{/if}}
{{#if supplements}}- Took supplements: {{supplements}}{{/if}}
{{#if missed_meals}}- Missed meals: {{missed_meals}}{{/if}}
{{#if hunger_level}}- Hunger level: {{hunger_level}}/5{{/if}}
{{#if stress_level}}- Stress level: {{stress_level}}/5{{/if}}

## Photos
{{#if has_photos}}
[User provided {{photo_count}} photo(s) - analyze the meal composition, portions, and quality]
{{else}}
[No photos provided - base feedback on answers and notes only]
{{/if}}

## Your Task

Provide a JSON response with:

```json
{
  "habitScore": {
    "protein": 0-10,
    "plants": 0-10,
    "liquids": 0-10,
    "snacks": 0-10,
    "training": 0-10
  },
  "feedbackShort": "2-3 encouraging sentences based on what you see",
  "oneAction": "One specific, actionable tip for their next meal",
  "confidence": "low|med|high",
  "flags": {
    "possibleED": false,
    "medical": false,
    "unsafe": false
  }
}
```

Remember:
- Be specific to what they shared
- Tie back to their goal ({{goal_name}})
- Use {{tone}} tone
- Focus on ONE action, not overwhelming lists
