# Teneo Memory Dashboard

A Next.js 14 dashboard for viewing call analytics and sentiment tracking from your Azure SQL Database.

## Features

- 🔐 **Authentication**: Simple email/password login with NextAuth.js
- 📊 **Call Metrics**: Real-time call statistics, resolution rates, and performance metrics
- 📈 **Sentiment Analysis**: Visual trends of customer sentiment over time
- 🎨 **Modern UI**: Built with Tailwind CSS and Recharts
- ⚡ **Fast API**: Next.js API routes directly connected to Azure SQL

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual credentials:

```env
# Azure SQL Database Connection
DB_SERVER=solutionarch.database.windows.net
DB_DATABASE=teneomemory
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Demo Users (comma-separated: email:password)
DEMO_USERS=admin@teneo.ai:admin123,user@teneo.ai:user123
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page.

**Default credentials:** `admin@teneo.ai` / `admin123`

## Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # NextAuth endpoints
│   │   │   ├── metrics/summary/       # Call metrics API
│   │   │   └── sentiment/trends/      # Sentiment data API
│   │   ├── dashboard/                 # Main dashboard page
│   │   ├── login/                     # Login page
│   │   ├── globals.css                # Global styles
│   │   ├── layout.tsx                 # Root layout
│   │   └── page.tsx                   # Home (redirects)
│   ├── components/
│   │   ├── MetricCard.tsx             # Metric display cards
│   │   ├── SentimentChart.tsx         # Line chart component
│   │   └── SessionProvider.tsx        # Auth wrapper
│   └── lib/
│       ├── auth.ts                    # NextAuth configuration
│       └── db.ts                      # Database connection
├── public/                            # Static assets
├── .env.local.example                 # Environment template
├── next.config.js                     # Next.js config
├── tailwind.config.js                 # Tailwind CSS config
└── package.json
```

## API Endpoints

### `/api/metrics/summary`
Get overall call metrics with optional filters:
- `?startDate=2024-01-01` - Filter by start date
- `?endDate=2024-12-31` - Filter by end date
- `?channel=Voice` - Filter by channel
- `?city=New York` - Filter by city

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 1250,
    "completionRate": 87.5,
    "resolutionRate": 82.3,
    "avgDurationSeconds": 245.6,
    ...
  }
}
```

### `/api/sentiment/trends`
Get sentiment progression over time:
- `?startDate=2024-01-01` - Filter by start date
- `?endDate=2024-12-31` - Filter by end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "callDate": "2024-01-15",
      "totalCalls": 45,
      "positiveSentimentRate": 68.9,
      "negativeSentimentRate": 12.3,
      "improvementRate": 45.2
    },
    ...
  ]
}
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
# From the TeneoMemory directory
git init
git add .
git commit -m "Initial commit: Teneo Memory Dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/teneo-memory.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `dashboard`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3. Add Environment Variables in Vercel

In the Vercel project settings, add all variables from `.env.local`:

- `DB_SERVER`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `NEXTAUTH_URL` (use your Vercel URL: `https://your-project.vercel.app`)
- `NEXTAUTH_SECRET`
- `DEMO_USERS`

### 4. Deploy

Vercel will automatically deploy. Future commits to `main` will trigger redeployments.

## Database Views Used

The dashboard connects to these SQL views:
- `vw_CallsEnriched` - For call metrics summary
- `vw_SentimentProgression` - For sentiment trends

Make sure you've run these SQL scripts in order:
1. `02_OptimizeTables.sql`
2. `03_CreateViews_Base.sql`
3. `04_CreateViews_Analytics.sql`
4. `05_CreateFunctions.sql`

## Adding More Users

Edit the `DEMO_USERS` environment variable:

```env
DEMO_USERS=admin@teneo.ai:admin123,john@company.com:password456,sarah@company.com:pass789
```

Format: `email1:password1,email2:password2,...`

## Customization

### Add More Metrics

1. Create a new API route in `src/app/api/`
2. Query your SQL views using the `query()` function from `@/lib/db`
3. Add a new component to display the data
4. Import it in `src/app/dashboard/page.tsx`

### Change Colors/Styling

Edit `tailwind.config.js` to customize the color palette:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      },
    },
  },
},
```

## Troubleshooting

### Database Connection Errors

- Verify Azure SQL firewall rules allow Vercel IPs
- Check connection string format
- Ensure SSL/encryption is enabled

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** NextAuth.js 4
- **Database:** Azure SQL Server (mssql package)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Language:** TypeScript

## License

MIT
