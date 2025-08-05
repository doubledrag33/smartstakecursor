# SmartStake

SmartStake is a comprehensive betting tracking application that helps sports bettors analyze their performance, manage multiple bankrolls, and track ROI with advanced analytics.

## Features

- **Multi-Provider Authentication**: OAuth with Google/Apple + magic-link
- **Bet Tracking**: Manual entry and OCR photo upload
- **Multi-Bankroll Management**: Separate bankrolls with public sharing
- **Performance Analytics**: ROI, yield, profit/loss tracking
- **Auto-Verification**: Results feed integration with SofaScore API
- **Referral System**: Built-in referral program
- **Mobile-First Design**: Responsive PWA-ready interface

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **OCR**: Tesseract.js + GPT-4o for bet slip parsing
- **Payments**: Stripe (€5.99/month subscription)
- **Deployment**: Railway
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account
- Stripe account (for payments)
- OpenAI API key (for OCR parsing)

### Environment Variables

Copy `.env.production.example` to `.env.local` and fill in your values:

```bash
cp .env.production.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security on all tables
4. Configure OAuth providers in Supabase Auth settings

## Deploy on Railway

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/smartstake)

### Manual Deployment

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

3. **Login and Initialize**:
   ```bash
   railway login
   railway init
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url_here
   railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   # ... add all other environment variables
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

### Automatic Deployment

The project includes GitHub Actions for automatic deployment:

1. Fork this repository
2. Add `RAILWAY_TOKEN` to your GitHub repository secrets
3. Push to the `main` branch to trigger deployment

### Environment Variables in Railway

Set these variables in your Railway dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SOFASCORE_API_KEY`
- `SPORTDATA_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (your Railway app URL)
- `JWT_SECRET`

## Project Structure

```
smartstake/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── middleware.ts        # Auth middleware
├── supabase/
│   └── migrations/          # Database migrations
├── railway.json             # Railway configuration
└── .github/workflows/       # GitHub Actions
```

## API Routes

- `GET /api/bets` - Fetch user's bets
- `POST /api/bets` - Create new bet
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@smartstake.app or create an issue on GitHub.
