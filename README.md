# HustleUp MVP

A full-stack MVP for a part-time jobs marketplace.

## Features

- Landing page
- Public waitlist
- Job seeker / job owner signup
- Supabase authentication
- Profile page
- Job listing page
- Job posting page
- Job application flow
- Beginner / Basic / Premium / Advanced tiers
- Admin dashboard for waitlist, users, and jobs

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase Postgres

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

Create a project at Supabase, then copy your project URL and anon key.

Create `.env.local`:

```bash
copy .env.example .env.local
```

Then fill:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Create database tables

Open Supabase Dashboard > SQL Editor and run everything inside:

```txt
supabase/schema.sql
```

### 4. Run app

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Make yourself admin

After signing up, go to Supabase SQL Editor and run:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

Then visit:

```txt
http://localhost:3000/admin
```

## Important note

For faster testing, in Supabase Dashboard > Authentication > Providers > Email,
you can disable email confirmation during development.
