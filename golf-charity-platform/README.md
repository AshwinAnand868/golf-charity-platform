# GolfGives — Golf Charity Subscription Platform

> **Play. Win. Give.** — A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (via MongoDB Atlas) |
| Auth | JWT (jsonwebtoken) |
| Payments | Stripe (Checkout + Webhooks) |
| State | Zustand |
| Deployment | Vercel (frontend + backend) |

---

## 📁 Project Structure

```
golf-charity-platform/
├── backend/                  # Express + TypeScript API
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── middleware/      # Auth, admin guards
│   │   ├── models/          # Mongoose models (User, Score, Charity, Draw)
│   │   ├── routes/          # All API routes
│   │   └── utils/           # Draw engine, seed script
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
│
└── frontend/                 # Next.js 14 App
    ├── src/
    │   ├── app/             # Pages (App Router)
    │   │   ├── page.tsx               # Homepage
    │   │   ├── auth/login/            # Login
    │   │   ├── auth/register/         # Register
    │   │   ├── subscribe/             # Subscription page
    │   │   ├── charity/               # Public charity listing
    │   │   ├── draw/                  # Public draw results
    │   │   ├── dashboard/             # User dashboard
    │   │   │   ├── page.tsx           # Dashboard home
    │   │   │   ├── scores/            # Score management
    │   │   │   ├── charity/           # Charity selection
    │   │   │   └── draws/             # Draw history & winnings
    │   │   └── admin/                 # Admin panel
    │   │       ├── page.tsx           # Admin home
    │   │       ├── users/             # User management
    │   │       ├── draws/             # Draw management
    │   │       ├── charities/         # Charity management
    │   │       └── winners/           # Winner verification
    │   ├── components/      # Shared components
    │   ├── lib/             # API client (axios)
    │   ├── store/           # Zustand auth store
    │   └── types/           # TypeScript types
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vercel.json
```

---

## 🚀 DEPLOYMENT GUIDE (Step by Step)

### Prerequisites
- Node.js 18+
- A new MongoDB Atlas account (free tier works)
- A new Vercel account
- A Stripe account (test mode is fine)

---

### STEP 1 — MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Create free account
2. Create a new **Project** → Create a **Cluster** (M0 Free Tier)
3. Under **Database Access** → Add a database user (username + password, save these)
4. Under **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`)
5. Click **Connect** on your cluster → **Connect your application** → Copy the connection string

Your URI looks like:
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/golf-charity?retryWrites=true&w=majority
```

---

### STEP 2 — Stripe Setup

1. Go to [stripe.com](https://stripe.com) → Create account
2. Go to **Developers → API Keys** → Copy your **Secret Key** (`sk_test_...`) and **Publishable Key** (`pk_test_...`)
3. Create two products in Stripe:
   - **Monthly Plan**: £19.99/month recurring → Copy the **Price ID** (`price_...`)
   - **Yearly Plan**: £199.99/year recurring → Copy the **Price ID** (`price_...`)
4. Go to **Developers → Webhooks** → Add endpoint (you'll fill this URL after deploying backend)
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

---

### STEP 3 — Deploy the Backend to Vercel

1. Push your code to GitHub (create a new repo)
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Framework Preset** to `Other`
5. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Any long random string (e.g. `golf-charity-super-secret-2025-xyz`) |
| `JWT_EXPIRES_IN` | `7d` |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | (add after step 4) |
| `STRIPE_MONTHLY_PRICE_ID` | `price_...` for monthly plan |
| `STRIPE_YEARLY_PRICE_ID` | `price_...` for yearly plan |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (update after frontend deploy) |
| `NODE_ENV` | `production` |

6. Click **Deploy** → Copy your backend URL (e.g. `https://golf-charity-backend.vercel.app`)

---

### STEP 4 — Add Stripe Webhook

1. Go back to Stripe → Developers → Webhooks
2. Edit your endpoint → Set URL to: `https://your-backend.vercel.app/api/webhooks/stripe`
3. Copy the **Signing Secret** (`whsec_...`)
4. Go back to Vercel backend project → Settings → Environment Variables
5. Add `STRIPE_WEBHOOK_SECRET` = `whsec_...`
6. Redeploy the backend (Deployments → Redeploy)

---

### STEP 5 — Deploy the Frontend to Vercel

1. Go to Vercel → New Project → Import same GitHub repo
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Next.js`
4. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.vercel.app/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` from Stripe |

5. Click **Deploy** → Copy your frontend URL
6. Go back to the **backend** Vercel project → Update `FRONTEND_URL` → Redeploy

---

### STEP 6 — Seed the Database

After both are deployed, run the seed script locally:

```bash
cd backend
cp .env.example .env
# Fill in your MONGODB_URI in .env
npm install
npm run seed
```

This creates:
- ✅ 4 charities
- ✅ Admin user: `admin@golfcharity.com` / `Admin@1234`
- ✅ Test player: `player@golfcharity.com` / `Player@1234`

---

## 💻 Local Development

```bash
# 1. Clone and install
git clone <your-repo>
cd golf-charity-platform

# 2. Backend setup
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env.local
# Edit .env.local
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:5000

---

## 🧪 Testing Checklist

### User Flow
- [ ] Register new account at `/auth/register`
- [ ] Subscribe via Stripe test card: `4242 4242 4242 4242`, any future date, any CVC
- [ ] Add 5 scores at `/dashboard/scores`
- [ ] Select charity at `/dashboard/charity`
- [ ] View dashboard stats at `/dashboard`

### Admin Flow
- [ ] Login as `admin@golfcharity.com`
- [ ] View stats at `/admin`
- [ ] Manage users at `/admin/users`
- [ ] Run draw simulation at `/admin/draws`
- [ ] Publish draw at `/admin/draws`
- [ ] Add/edit charity at `/admin/charities`
- [ ] Verify winner at `/admin/winners`

### Draw System
- [ ] Go to Admin → Draw Management
- [ ] Select month/year/draw type
- [ ] Click "Run Simulation" — see drawn numbers + winners
- [ ] Click "Publish Draw" — users can now see results
- [ ] As test user, check `/dashboard/draws` for win status

---

## 📋 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Scores (requires auth + active subscription)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scores` | Get my scores |
| POST | `/api/scores` | Add score |
| PUT | `/api/scores/:index` | Update score |
| DELETE | `/api/scores/:index` | Delete score |

### Draws
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/draws` | All published draws |
| GET | `/api/draws/current` | Current month draw |
| POST | `/api/draws/simulate` | Admin: run simulation |
| POST | `/api/draws/:id/publish` | Admin: publish draw |
| POST | `/api/draws/:id/submit-proof` | User: submit winner proof |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions/create-checkout` | Create Stripe session |
| POST | `/api/subscriptions/cancel` | Cancel subscription |
| POST | `/api/subscriptions/reactivate` | Reactivate subscription |
| GET | `/api/subscriptions/portal` | Stripe billing portal |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users (paginated) |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/winners` | All winners |

---

## 🔐 Security Features

- JWT authentication on all protected routes
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS configured to frontend URL only
- Subscription validation on every authenticated request
- Stripe webhook signature verification

---

## 🎨 Design System

The platform uses a custom dark design system:
- **Primary**: `#22c55e` (brand green)
- **Gold**: `#f59e0b` (prizes/draws)
- **Background**: `#020617` (deep navy-black)
- **Font Display**: Playfair Display (serif)
- **Font Body**: DM Sans

---

## ⚙️ Key Business Logic

### Score Rolling System
- Users store max 5 scores
- New score added → sorted by date desc → oldest dropped if >5
- Scores validated: 1–45 (Stableford range)

### Draw Engine
- **Random**: Pure lottery — 5 unique numbers from 1–45
- **Algorithmic**: Weighted by score frequency — less common numbers drawn more often
- Match detection: user's 5 scores vs drawn 5 numbers
- 5-match jackpot rolls over if no winner

### Prize Pool (per 100 active subscribers at £19.99/month)
- 30% of each subscription → prize pool = ~£599.70/month
- 40% jackpot = ~£239.88
- 35% 4-match = ~£209.90  
- 25% 3-match = ~£149.93

### Charity Contribution
- Minimum 10% of subscription fee
- User-configurable up to 100%
- Tracked per charity via `totalReceived`
- Processed on each successful Stripe `invoice.paid` webhook

---

Built with ❤️ for Digital Heroes trainee selection — 2025
