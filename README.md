# Baby Tracker 👶

A beautiful, playful baby tracking web application built with Next.js, Supabase, and Tailwind CSS.

Track your baby's feeding, sleep, diapers, and growth with an intuitive, mobile-first interface.

## Features

- 🍼 **Feeding Tracking**
  - Bottle feeding with amount tracking
  - Breast feeding with LEFT/RIGHT breast timer
  - Start/stop timer with automatic duration calculation
  - Timer persists across page reloads

- 😴 **Sleep Tracking**
  - Log naps and nighttime sleep
  - Active sleep timer
  - Daily sleep summaries and statistics

- 🎯 **Diaper Tracking**
  - Quick wet/dirty logging
  - Daily diaper count
  - Change history with timestamps

- 📊 **Growth Tracking**
  - Weight, height, and head circumference
  - Visual charts showing growth over time
  - Track developmental milestones

- 👶 **Multi-Baby Support**
  - Manage multiple babies
  - Switch between baby profiles
  - Separate tracking for each child

- 🔐 **Secure Authentication**
  - Email/password signup and login
  - Google OAuth integration
  - Row-level security on all data

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom baby theme
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth + Email)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great!)

### Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   Follow the detailed instructions in [`supabase/README.md`](./supabase/README.md):
   - Create a Supabase project
   - Apply database migrations
   - Enable Google OAuth (optional)

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
baby-app/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Main app pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── feeding/                  # Feeding tracking components
│   ├── sleep/                    # Sleep tracking components
│   ├── diaper/                   # Diaper tracking components
│   ├── growth/                   # Growth tracking components
│   ├── layout/                   # Layout components
│   └── ui/                       # Reusable UI components
│
├── lib/                          # Utilities and hooks
│   ├── supabase/                 # Supabase clients
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Helper functions
│   └── types/                    # TypeScript types
│
├── supabase/                     # Database migrations
│   ├── migrations/               # SQL migration files
│   └── README.md                 # Supabase setup guide
│
└── public/                       # Static assets
```

## Development Roadmap

### ✅ Phase 1: Project Setup (COMPLETE)
- [x] Next.js initialization
- [x] Tailwind CSS with baby theme
- [x] All dependencies installed
- [x] Environment configuration

### ✅ Phase 2: Database Setup (COMPLETE)
- [x] Database schema created (6 tables)
- [x] Row Level Security policies
- [x] Automated triggers and functions
- [x] Setup documentation

### 🚧 Phase 3: Authentication (NEXT)
- [ ] Supabase auth integration
- [ ] Login/signup pages
- [ ] Google OAuth
- [ ] Protected routes

### 📋 Phase 4: Core UI Components
- [ ] Button, Card, Input components
- [ ] Modal, DatePicker
- [ ] Loading and empty states

### 📋 Phase 5: Layout & Navigation
- [ ] App shell with navigation
- [ ] Header with baby switcher
- [ ] Responsive mobile/desktop layouts

### 📋 Phase 6: Baby Management
- [ ] Create/edit baby profiles
- [ ] Baby switcher context
- [ ] Multi-baby support

### 📋 Phase 7: Dashboard
- [ ] Quick action buttons
- [ ] Daily summary cards
- [ ] Recent activity feed

### 📋 Phase 8: Feeding Tracking
- [ ] Bottle feeding form
- [ ] Breast feeding timer (LEFT/RIGHT)
- [ ] Timer persistence
- [ ] Feeding history

### 📋 Phases 9-14
- Sleep tracking
- Diaper tracking
- Growth charts
- Mobile optimization
- Additional features
- Testing & deployment

## Design System

### Colors
- **Pastel Theme**: Soft pink, blue, yellow, green, purple, peach
- **Primary**: #FF6B8A (Pastel pink)
- **Accent**: #0074FF (Baby blue)

### Typography
- **Headings**: Fredoka (playful, rounded)
- **Body**: Inter (clean, readable)

### UI Principles
- Rounded corners everywhere (2rem - 2.5rem)
- Soft shadows for depth
- Large touch targets for mobile (min 44px)
- Playful animations on interactions
- Pastel colors with high contrast text

## Contributing

This is a personal baby tracking project. Feel free to fork and customize for your own use!

## License

MIT

## Support

For issues or questions:
- Check the [Supabase setup guide](./supabase/README.md)
- Review the [implementation plan](/.claude/plans/)
- Open an issue on GitHub

---

Built with ❤️ for parents and caregivers
