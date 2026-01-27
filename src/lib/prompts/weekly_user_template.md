# Weekly Summary Template

## User Context
- **Goal**: {{goal_name}} - {{goal_description}}
- **Week**: {{week_key}}
- **Check-ins This Week**: {{checkin_count}}

## This Week's Check-Ins

{{#each checkins}}
### {{this.date}} - {{this.meal_type}}
- Habit Score: Protein {{this.protein}}, Plants {{this.plants}}, Liquids {{this.liquids}}, Snacks {{this.snacks}}, Training {{this.training}}
- Notes: {{this.notes}}
- Feedback given: {{this.feedback_short}}
{{/each}}

## Your Task

Analyze the week and provide a JSON response:

```json
{
  "summary": "2-3 sentences about their overall week - celebrate wins, acknowledge challenges",
  "pattern": "One key pattern you noticed (could be positive or area for growth)",
  "nextWeekFocus": "One specific, actionable focus for next week that builds on their progress"
}
```

Guidelines:
- Look for **trends** across days (consistency, timing, types of meals)
- Notice **improvements** from earlier in the week
- Identify **opportunities** without being critical
- Keep it **actionable** and **encouraging**
- Reference their goal: {{goal_name}}

Avoid:
- Generic advice that could apply to anyone
- Overwhelming them with too many suggestions
- Focusing only on negatives
- Unrealistic expectations
