# Deploy SmartStake on Railway

This guide walks you through deploying SmartStake to Railway, a modern platform for deploying full-stack applications.

## Prerequisites

- GitHub account with the SmartStake repository
- Railway account ([railway.app](https://railway.app))
- Supabase project with database configured
- Required API keys (OpenAI, Stripe, etc.)

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)

1. Click the Railway deploy button:
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/smartstake)

2. Connect your GitHub account
3. Set environment variables (see below)
4. Deploy!

### Option 2: Manual Deployment

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your SmartStake repository

2. **Configure Environment Variables**
   
   In your Railway dashboard, go to Variables and add:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI (for OCR)
   OPENAI_API_KEY=sk-your-openai-key

   # Stripe (for payments)
   STRIPE_SECRET_KEY=sk_live_or_test_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # App Config
   NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   NEXT_PUBLIC_APP_NAME=SmartStake
   JWT_SECRET=your-random-jwt-secret

   # Optional APIs
   SOFASCORE_API_KEY=your_sofascore_key
   SPORTDATA_API_KEY=your_sportdata_key
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app.railway.app`

## Automatic Deployments

The repository includes GitHub Actions for automatic deployments:

1. **Add Railway Token to GitHub Secrets**
   - Go to your GitHub repository → Settings → Secrets
   - Add new secret: `RAILWAY_TOKEN`
   - Get token from Railway dashboard → Account → Tokens

2. **Push to Main Branch**
   - Any push to `main` branch triggers automatic deployment
   - Check deployment status in GitHub Actions tab

## Database Migration

After deployment, run the database migration:

1. **Access Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run Migration**
   - Copy content from `supabase/migrations/001_initial_schema.sql`
   - Execute in SQL Editor

3. **Verify Tables**
   - Check that all tables are created
   - Verify RLS policies are active

## Post-Deployment Setup

### 1. Configure Supabase Auth

- **Site URL**: Set to your Railway app URL
- **Redirect URLs**: Add your Railway domain
- **OAuth Providers**: Configure Google/Apple OAuth

### 2. Configure Stripe Webhooks

- **Endpoint URL**: `https://your-app.railway.app/api/webhooks/stripe`
- **Events**: Select payment-related events
- **Copy webhook secret** to Railway environment variables

### 3. Test the Application

- Visit your Railway app URL
- Test user registration
- Verify bet creation
- Check dashboard functionality

## Troubleshooting

### Build Failures

- Check build logs in Railway dashboard
- Verify all environment variables are set
- Ensure Node.js version compatibility

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies are properly configured
- Ensure database migration was successful

### Authentication Problems

- Verify Supabase auth configuration
- Check redirect URLs match your domain
- Confirm OAuth provider settings

## Monitoring

Railway provides built-in monitoring:

- **Metrics**: CPU, memory, network usage
- **Logs**: Application and build logs
- **Health Checks**: Automatic endpoint monitoring
- **Alerts**: Email notifications for issues

## Scaling

Railway automatically scales based on traffic:

- **Horizontal scaling**: Multiple instances during high traffic
- **Resource scaling**: CPU/memory adjustments
- **Geographic distribution**: Edge deployment options

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **SmartStake Issues**: Create GitHub issue
- **Railway Discord**: Community support

---

**Your SmartStake app is now live on Railway! 🚀**