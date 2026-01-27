# Quick Start Guide

Get Habit Coach running in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running (or use free hosted service)

## 1. Install

```bash
npm install
```

## 2. Set Up Environment

```bash
cp .env.example .env
```

**Minimum required for local development:**

```bash
# Database (use local or Neon free tier)
DATABASE_URL="postgresql://localhost:5432/habit_coach"

# Clerk (sign up at clerk.com - free tier)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Stripe (use test mode keys from stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage (use Cloudflare R2 - easiest setup)
STORAGE_ENDPOINT="https://..."
STORAGE_BUCKET="habit-photos"
STORAGE_ACCESS_KEY_ID="..."
STORAGE_SECRET_ACCESS_KEY="..."
STORAGE_PUBLIC_URL="https://..."

# OpenAI (get from openai.com)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"

# Local
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Set Up Database

```bash
npm run setup
```

This will:
- Create database tables
- Seed 6 default goals
- Prepare everything for development

## 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Test the Flow

1. Click "Sign In" → Create account
2. Complete onboarding (choose a goal)
3. Go to Dashboard
4. Click "New Check-In"
5. Upload a photo (optional on Free tier)
6. Answer questions
7. Submit and view AI feedback

## Test Accounts

### Stripe Test Cards

Use these in checkout:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any CVC

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy webhook secret to .env
```

## Common Issues

### Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready

# Create database manually
createdb habit_coach

# Test connection
psql $DATABASE_URL
```

### Clerk Auth Not Working
- Make sure redirect URLs in Clerk dashboard match:
  - Sign in: `/login`
  - After sign in: `/onboarding`

### Photos Not Uploading
- Check CORS settings on R2/S3 bucket
- Verify storage credentials are correct
- Test with small image first

## Free Service Tiers

All of these have free tiers:

- **Database**: [Neon](https://neon.tech) - Free PostgreSQL
- **Auth**: [Clerk](https://clerk.com) - 5,000 MAUs free
- **Storage**: [Cloudflare R2](https://cloudflare.com/r2) - 10GB free
- **Payments**: [Stripe](https://stripe.com) - Pay per transaction
- **AI**: [OpenAI](https://openai.com) - Pay per token (cheap for testing)

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter

npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm run setup        # Complete setup
```

## Next Steps

Once running locally:

1. **Customize Goals**: Edit `prisma/seed.ts` and re-run
2. **Adjust Prompts**: Edit files in `src/lib/prompts/`
3. **Change Pricing**: Update Stripe price and `src/app/pricing/page.tsx`
4. **Add Features**: Start with `src/app/` for pages
5. **Deploy**: Follow `DEPLOYMENT.md`

## Project Structure

```
src/
├── app/
│   ├── api/           # Backend endpoints
│   └── (pages)/       # Frontend pages
├── components/        # React components
└── lib/              # Business logic
    ├── llm.ts        # AI integration
    ├── safety.ts     # Safety checks
    └── prompts/      # LLM templates
```

## Key Files

- `prisma/schema.prisma` - Database structure
- `src/lib/llm.ts` - AI analysis logic
- `src/lib/safety.ts` - Safety checks
- `src/components/CheckInForm.tsx` - Main form

## Getting Help

1. Check `README.md` for overview
2. Read `SETUP_GUIDE.md` for details
3. Review `DEPLOYMENT.md` for production
4. See `PROJECT_SUMMARY.md` for architecture

## Ready to Ship?

Follow `DEPLOYMENT.md` to deploy to production.

---

**Time to first check-in**: ~10 minutes  
**Time to production**: ~1 hour

Good luck! 🚀
