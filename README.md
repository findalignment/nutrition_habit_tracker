# Habit Coach - Nutrition Habit Tracker

A Next.js app that helps users build better nutrition habits through photo-based check-ins and AI-powered feedback.

## What It Does

Every check-in includes:
- Optional photo(s) of meals
- Fixed yes/no questions about habits
- Optional notes
- One AI-powered feedback response
- One actionable next step

## Features

- 📸 Photo-based meal tracking
- 🤖 AI-powered personalized feedback
- 📊 Weekly habit summaries and patterns
- 🎯 Goal-based coaching
- 💳 Stripe subscription integration
- 🔒 Built-in safety checks
- ⚡ Rate limiting and abuse prevention

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma
- **Payments**: Stripe
- **Storage**: S3-compatible (AWS S3 or Cloudflare R2)
- **AI**: OpenAI GPT-4

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account (free tier available)
- Stripe account (test mode works)
- S3-compatible storage (Cloudflare R2 recommended)
- OpenAI API key

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Fill in your API keys and credentials in `.env`:

- **DATABASE_URL**: PostgreSQL connection string
- **Clerk keys**: From [clerk.com](https://clerk.com) dashboard
- **Stripe keys**: From [stripe.com](https://stripe.com) dashboard
- **Storage credentials**: From your S3/R2 provider
- **OPENAI_API_KEY**: From [openai.com](https://openai.com)

### 3. Set Up Database

```bash
# Run all setup steps at once
npm run setup

# Or run individually:
npm run db:push    # Create tables
npm run db:seed    # Add initial goals
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/
    api/              # API routes
      checkins/       # CRUD for check-ins
      analyze/        # AI analysis
      weekly/         # Weekly summaries
      stripe/         # Payment webhooks
      onboarding/     # Goal selection
    (pages)/          # App pages
      page.tsx        # Landing
      dashboard/      # Main dashboard
      checkin/        # Create & view check-ins
      settings/       # User settings
      pricing/        # Subscription plans
  components/         # React components
  lib/               # Business logic
    auth.ts          # Authentication
    db.ts            # Prisma client
    llm.ts           # OpenAI integration
    safety.ts        # Safety checks
    scoring.ts       # Habit scores
    storage.ts       # File uploads
    stripe.ts        # Payments
    validators.ts    # Zod schemas
    prompts/         # LLM templates
  styles/            # Tailwind CSS
prisma/
  schema.prisma      # Database schema
  seed.ts           # Seed data
```

## API Routes

### Check-ins
- `POST /api/checkins` - Create check-in
- `GET /api/checkins` - List check-ins
- `GET /api/checkins/[id]` - Get single check-in
- `PUT /api/checkins/[id]` - Update check-in

### Analysis
- `POST /api/analyze` - Analyze check-in with AI

### Weekly
- `POST /api/weekly` - Generate summary (Pro only)
- `GET /api/weekly` - List summaries

### Stripe
- `POST /api/stripe/checkout` - Start checkout
- `POST /api/stripe/portal` - Billing portal
- `POST /api/stripe/webhook` - Handle webhooks

### Storage
- `POST /api/upload-url` - Get upload URL

## Subscription Tiers

### Free
- 1 check-in per day
- Text-only feedback
- Last 3 days history
- Basic habit scores

### Pro ($24/mo)
- Unlimited check-ins
- Photo-based AI feedback
- Weekly summaries
- 30-day history
- Priority support

## Rate Limits

- **Upload URLs**: 30/day per user
- **Check-ins**: 10/day per user
- **Analysis**: 10/day per user

## Safety Features

Built-in checks for:
- Eating disorder behaviors
- Medical advice requests
- Self-harm indicators
- Age verification

## Testing Locally

### Stripe Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret to .env
```

### Photo Uploads

Configure CORS on your S3/R2 bucket to allow uploads from localhost.

## Deployment

### Recommended Setup

1. **Hosting**: Vercel
2. **Database**: Neon (free PostgreSQL)
3. **Storage**: Cloudflare R2 (no egress fees)
4. **Auth**: Clerk (free tier)
5. **Payments**: Stripe

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Database Scripts

```bash
npm run db:push       # Push schema to database
npm run db:migrate    # Create migration
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed initial data
npm run setup         # Run all setup steps
```

## Common Issues

**Clerk redirects not working:**
- Check redirect URLs in Clerk dashboard match your environment variables

**Stripe webhook failing:**
- Use Stripe CLI for local testing
- Verify webhook secret in production

**Photo uploads failing:**
- Check CORS settings on bucket
- Verify storage credentials

**Database connection errors:**
- Verify DATABASE_URL format
- Run `npm run db:push` to sync schema

## Environment Variables

See `.env.example` for all required variables.

Required services:
- PostgreSQL database
- Clerk account
- Stripe account
- S3/R2 storage
- OpenAI API key

## Contributing

Contributions welcome! Open an issue or PR.

## License

MIT
