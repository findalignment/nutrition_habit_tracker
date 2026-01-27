# Habit Coach - Detailed Setup Guide

This guide walks you through setting up the entire Habit Coach application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service Setup](#service-setup)
3. [Local Development](#local-development)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Install the following before starting:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL**: Install locally or use a hosted service
- **Git**: For version control

## Service Setup

### 1. Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Choose "Email" and "Google" (optional) for authentication methods
4. In the dashboard, go to **API Keys**
5. Copy your keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
   - `CLERK_SECRET_KEY=sk_test_...`
6. Go to **Paths** in the sidebar
7. Configure redirect paths:
   - Sign-in path: `/login`
   - Sign-up path: `/login`
   - After sign-in: `/onboarding`
   - After sign-up: `/onboarding`

### 2. PostgreSQL Database

**Option A: Local (Development)**

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or apt-get install postgresql  # Linux

# Start PostgreSQL
brew services start postgresql

# Create database
createdb habit_coach

# Your DATABASE_URL:
DATABASE_URL="postgresql://localhost:5432/habit_coach"
```

**Option B: Neon (Recommended for Production)**

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add to `.env`: `DATABASE_URL="postgresql://..."`

**Option C: Other Hosted Options**
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Render](https://render.com)

### 3. Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) and create account
2. Switch to **Test Mode** (toggle in top-right)
3. Go to **Developers** → **API keys**
4. Copy your keys:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
5. Create a product:
   - Go to **Products** → **Add product**
   - Name: "Habit Coach Pro"
   - Price: $24/month (recurring)
   - Click **Save**
   - Copy the **Price ID** (starts with `price_`)
   - `STRIPE_PRICE_ID_PRO=price_...`
6. Set up webhook (later, after deployment)

### 4. Cloudflare R2 (Storage)

1. Go to [cloudflare.com](https://cloudflare.com) and create account
2. Go to **R2 Object Storage**
3. Create a bucket:
   - Name: `habit-photos` (or your choice)
   - Click **Create bucket**
4. Click on bucket → **Settings** → **CORS policy**
5. Add CORS policy:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```
6. Go to **Manage R2 API Tokens**
7. Create API token:
   - Permissions: Object Read & Write
   - Click **Create API Token**
8. Copy credentials:
   - `STORAGE_ACCESS_KEY_ID=...`
   - `STORAGE_SECRET_ACCESS_KEY=...`
   - `STORAGE_ENDPOINT=...`
   - `STORAGE_BUCKET=habit-photos`
9. Get public URL:
   - Go to bucket → **Settings** → **Public access**
   - Enable public access
   - Copy the public URL
   - `STORAGE_PUBLIC_URL=https://...`

**Alternative: AWS S3**

If using S3 instead:
- Create bucket in AWS Console
- Enable public access or use signed URLs
- Create IAM user with S3 permissions
- Copy access key, secret, and bucket name

### 5. OpenAI (AI)

1. Go to [openai.com](https://openai.com)
2. Create account and add payment method
3. Go to **API keys**
4. Create new secret key
5. Copy: `OPENAI_API_KEY=sk-...`
6. Choose model:
   - `gpt-4o` (recommended, best quality)
   - `gpt-4o-mini` (cheaper, good quality)
   - Set: `OPENAI_MODEL=gpt-4o`

## Local Development

### 1. Clone and Install

```bash
cd /path/to/habit-coach
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Fill in all values from the services above.

### 3. Set Up Database

```bash
# Run complete setup
npm run setup

# This does:
# - npm install
# - npm run db:push (creates tables)
# - npm run db:seed (adds initial goals)
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 5. Test the Flow

1. **Sign Up**: Click "Sign In" → Create account
2. **Onboarding**: Choose a goal and set preferences
3. **Dashboard**: View your empty dashboard
4. **Check-In**: Create your first check-in
5. **Analysis**: Wait for AI feedback

## Testing

### Test Stripe Locally

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login:
```bash
stripe login
```

3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the webhook signing secret to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Test checkout:
```bash
# Use test card: 4242 4242 4242 4242
# Any future expiry, any CVC
```

### Test Photo Uploads

1. Make sure CORS is configured on your bucket
2. Try uploading a photo in check-in
3. Check browser console for errors
4. Verify file appears in R2/S3 bucket

### Test AI Analysis

1. Create a check-in with notes
2. Submit and wait for feedback
3. Check API logs in terminal
4. Verify OpenAI API was called

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/habit-coach.git
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`

3. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from your `.env` file
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel URL

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

5. **Update Service URLs**:
   - **Clerk**: Add production domain to allowed origins
   - **Stripe**: Add webhook endpoint:
     - URL: `https://yourdomain.com/api/stripe/webhook`
     - Events: `customer.subscription.*`, `invoice.payment_*`
     - Copy webhook secret to Vercel env vars

### Database Migration

If you used local DB for development, migrate to production:

1. Update `DATABASE_URL` in Vercel to production database
2. Run migration:
```bash
# Option 1: Use Vercel CLI
vercel env pull .env.production
npm run db:push

# Option 2: Use Prisma Studio
npm run db:studio
# Then manually export/import data
```

## Troubleshooting

### "Cannot find module" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Database connection failed

- Verify DATABASE_URL is correct
- Check if database is running
- Test connection: `psql $DATABASE_URL`

### Clerk authentication not working

- Check all redirect URLs match in Clerk dashboard
- Verify environment variables are loaded
- Clear browser cookies and try again

### Stripe webhooks failing

- In development: Use Stripe CLI
- In production: Verify webhook secret matches
- Check webhook logs in Stripe dashboard

### Photo uploads not working

- Verify CORS is configured
- Check storage credentials
- Test with curl:
```bash
curl -X PUT -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg \
  "YOUR_PRESIGNED_URL"
```

### AI analysis errors

- Check OpenAI API key is valid
- Verify you have credits in OpenAI account
- Check API logs for error messages
- Try with simpler prompt first

### Build errors in Vercel

- Check Node version matches (18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors
- Try building locally: `npm run build`

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database connection working
- [ ] Clerk authentication working
- [ ] Stripe checkout working
- [ ] Stripe webhook configured and tested
- [ ] Photo uploads working
- [ ] AI analysis returning results
- [ ] All pages loading correctly
- [ ] Test with real user account
- [ ] Monitor error logs

## Monitoring

### Check Application Health

- **Vercel**: View logs in dashboard
- **Database**: Monitor connection pool
- **Stripe**: Check webhook logs
- **OpenAI**: Monitor usage and costs
- **R2/S3**: Check bandwidth usage

### Set Up Alerts

Consider adding:
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)
- Database monitoring
- Cost alerts (OpenAI, Stripe)

## Next Steps

1. Customize branding and colors
2. Add more goals to seed data
3. Tune LLM prompts for better feedback
4. Add email notifications
5. Implement analytics
6. Add more safety checks
7. Create admin dashboard

## Support

For issues:
1. Check this guide
2. Search GitHub issues
3. Open new issue with details
4. Include error logs and steps to reproduce

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [OpenAI Docs](https://platform.openai.com/docs)
