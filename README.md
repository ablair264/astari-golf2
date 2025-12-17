# ASTARI Golf Product Browser

Modern e-commerce application for ASTARI golf products built with React, Vite, and Neon Database.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Database:** Neon (PostgreSQL)
- **Animations:** Framer Motion, GSAP
- **UI Components:** Radix UI, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+
- Neon database account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Neon connection string.

### Database Setup

#### Run Schema Migration
```bash
psql "<your_neon_connection_string>" -f scripts/neon/schema.sql
```

#### Migrate Existing Databases (style codes)
If your database already exists and `products.style_no` is an `INTEGER`, importing products with alphanumeric style codes (e.g. `LAM-CL-01`) will fail. Run:
```bash
psql "<your_neon_connection_string>" -f scripts/neon/migrate-style-no-to-text.sql
```

#### Seed Sample Data
```bash
node scripts/neon/seed.js
```

This will populate your database with:
- 4 product categories (Grips, Bags, Clubs, Balls)
- 24 sample ASTARI golf products

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── lib/           # Utilities and clients (Neon, etc.)
├── pages/         # Route pages
├── services/      # Data services
└── App.jsx        # Main app component

scripts/
└── neon/          # Database scripts
    ├── schema.sql # Database schema
    └── seed.js    # Seed data
```

## Environment Variables

- `VITE_NEON_DATABASE_URL` - Neon PostgreSQL connection string
