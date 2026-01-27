import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default goals
  const goals = [
    {
      name: 'Reduce Snacking',
      description: 'Build awareness around snacking habits and reduce mindless eating between meals',
      constraints: {
        focus: ['snack_awareness', 'portion_control', 'meal_satisfaction'],
        avoid: ['restriction', 'elimination'],
      },
    },
    {
      name: 'Eat More Plants',
      description: 'Increase vegetable and fruit intake at each meal',
      constraints: {
        focus: ['vegetable_variety', 'fruit_intake', 'plant_diversity'],
        encourage: ['colorful_plates', 'whole_foods'],
      },
    },
    {
      name: 'Build Meal Consistency',
      description: 'Establish regular meal times and reduce missed meals',
      constraints: {
        focus: ['meal_timing', 'consistency', 'hunger_awareness'],
        track: ['skipped_meals', 'meal_spacing'],
      },
    },
    {
      name: 'Increase Protein Intake',
      description: 'Ensure adequate protein at each meal for satiety and nutrition',
      constraints: {
        focus: ['protein_sources', 'portion_sizing', 'meal_balance'],
        encourage: ['variety', 'quality_sources'],
      },
    },
    {
      name: 'Improve Hydration',
      description: 'Drink more water and reduce caloric beverages',
      constraints: {
        focus: ['water_intake', 'beverage_choices', 'liquid_calories'],
        track: ['sugary_drinks', 'alcohol'],
      },
    },
    {
      name: 'Practice Mindful Eating',
      description: 'Build awareness of hunger cues and eat without distractions',
      constraints: {
        focus: ['hunger_awareness', 'fullness_cues', 'eating_speed'],
        encourage: ['presence', 'enjoyment', 'satisfaction'],
      },
    },
  ]

  for (const goal of goals) {
    await prisma.goal.upsert({
      where: { name: goal.name },
      update: {},
      create: goal,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
