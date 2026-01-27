# Deployment Checklist

## Pre-Deployment

### Code Preparation
- [ ] All environment variables documented
- [ ] Database schema finalized
- [ ] Seed data ready
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Safety checks tested

### Service Accounts
- [ ] Clerk account created (production app)
- [ ] Stripe account in live mode
- [ ] Production database provisioned
- [ ] R2/S3 bucket configured
- [ ] OpenAI API key with billing

## Vercel Deployment

### 1. Prepare Repository

```bash
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/yourusername/habit-coach.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Select GitHub repository
4. Configure:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Install Command: `npm install`

### 3. Environment Variables

Add to Vercel dashboard (Settings → Environment Variables):

```bash
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_PRO=

# Storage
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_REGION=
STORAGE_PUBLIC_URL=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Deploy

Click **Deploy** and wait for build to complete.

## Post-Deployment Setup

### 1. Update Clerk

1. Go to Clerk dashboard
2. Navigate to your production application
3. Add production domain:
   - Go to **Domains**
   - Add your Vercel domain
4. Update redirect URLs if needed

### 2. Configure Stripe Webhook

1. Go to Stripe dashboard (LIVE MODE)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Configuration:
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Description: Production webhook
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret**
7. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Test Stripe Webhook

```bash
# Use Stripe CLI to test
stripe listen --forward-to https://yourdomain.com/api/stripe/webhook

# Or trigger test event in Stripe dashboard
```

### 4. Initialize Database

Option A: From local machine:
```bash
# Pull production env vars
vercel env pull .env.production

# Run migrations
DATABASE_URL="your-production-url" npm run db:push
DATABASE_URL="your-production-url" npm run db:seed
```

Option B: Use Prisma Studio:
```bash
DATABASE_URL="your-production-url" npm run db:studio
# Manually create initial records
```

### 5. Test Application

- [ ] Sign up flow works
- [ ] Onboarding completes
- [ ] Check-in creation works
- [ ] Photo upload works
- [ ] AI analysis runs
- [ ] Stripe checkout works
- [ ] Subscription upgrade works
- [ ] Weekly summary generates (Pro users)

### 6. Update Storage CORS

Add production domain to R2/S3 CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com",
      "https://yourdomain.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Monitoring Setup

### Error Tracking

Add Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

Update `next.config.js` with Sentry configuration.

### Analytics

Add Vercel Analytics:
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Uptime Monitoring

Set up with:
- [UptimeRobot](https://uptimerobot.com) (free)
- [BetterStack](https://betterstack.com)
- Vercel's built-in monitoring

## Cost Monitoring

### OpenAI
- Set spending limits in OpenAI dashboard
- Monitor daily costs
- Set up budget alerts

### Stripe
- Review transaction fees
- Monitor subscription churn

### Cloudflare R2
- Monitor bandwidth usage
- R2 has no egress fees (vs S3)

### Database
- Monitor connection pool
- Check query performance
- Scale as needed

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Webhook signatures verified
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] Content Security Policy configured (optional)

## Performance

### Database
- [ ] Indexes added to frequently queried fields
- [ ] Connection pooling configured
- [ ] Query optimization

### Images
- [ ] Using Next.js Image component
- [ ] Images optimized before upload
- [ ] CDN configured for R2/S3

### Caching
- [ ] API routes cached where appropriate
- [ ] Static pages generated at build time

## Backup Strategy

### Database
Set up automated backups:
- Neon: Automatic point-in-time recovery
- Self-hosted: Use `pg_dump` cron job

```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### User Data
- Check-ins stored in database (backed up)
- Photos in R2/S3 (configure versioning)

## Rollback Plan

If deployment fails:

1. **Vercel**: Click "Rollback" to previous deployment
2. **Database**: Restore from backup
3. **Investigate**: Check error logs
4. **Fix**: Address issue in staging first
5. **Redeploy**: When fix is confirmed

## Ongoing Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check API costs (OpenAI)
- [ ] Monitor user signups
- [ ] Review feedback quality

### Monthly
- [ ] Database performance review
- [ ] Update dependencies
- [ ] Review and adjust prompts
- [ ] Analyze user churn

### Quarterly
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Feature usage analysis
- [ ] Consider scaling needs

## Production URLs

Document your production URLs:

- **App**: https://yourdomain.com
- **Vercel Dashboard**: https://vercel.com/yourteam/habit-coach
- **Database**: [provider dashboard URL]
- **Clerk**: https://dashboard.clerk.com
- **Stripe**: https://dashboard.stripe.com
- **R2**: https://dash.cloudflare.com

## Support Contacts

- Vercel: [support link]
- Neon/Database: [support link]
- Clerk: [support link]
- Stripe: [support link]

## Emergency Procedures

### Site Down
1. Check Vercel status
2. Check database connection
3. Review recent deployments
4. Rollback if needed

### High Costs
1. Check OpenAI usage dashboard
2. Review rate limits
3. Temporarily disable AI features if needed
4. Investigate cause

### Data Breach Suspected
1. Immediately rotate all API keys
2. Review access logs
3. Contact users if needed
4. Document incident
5. Improve security measures

## Success Metrics

Track these metrics:
- User signups
- Daily active users
- Check-ins per day
- Conversion rate (free → pro)
- Churn rate
- Average feedback rating
- System uptime
- API response times

## Launch Day Checklist

- [ ] All systems tested
- [ ] Monitoring in place
- [ ] Backup strategy active
- [ ] Team notified
- [ ] Documentation complete
- [ ] Support channels ready
- [ ] Marketing materials ready
- [ ] Social media posts scheduled
- [ ] Press release sent (if applicable)

## Post-Launch

### First 24 Hours
- Monitor error logs continuously
- Watch user signups
- Test all critical flows
- Be ready for quick fixes

### First Week
- Gather user feedback
- Fix any critical bugs
- Monitor costs daily
- Adjust rate limits if needed

### First Month
- Analyze usage patterns
- Optimize prompts based on feedback
- Review pricing if needed
- Plan feature improvements

Good luck with your launch! 🚀
