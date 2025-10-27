# RentoH Setup Guide

This guide will help you configure and run RentoH locally or deploy it to production.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd RentoH
npm install
```

### 2. Configure Supabase

**Create a Supabase Project:**

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to your users)
3. Wait for the project to initialize (~2 minutes)

**Get Your API Keys:**

1. Go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

**Set Up the Database:**

1. Go to the **SQL Editor** in your Supabase dashboard
2. Run the schema file: `supabase/schema.sql`
3. This creates all necessary tables, RLS policies, and functions

### 3. Configure Environment Variables

```bash
# Copy the example file
cp env.example .env.local

# Edit .env.local with your actual values
# At minimum, you need:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration Details

### Required Environment Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Project Settings > API > Project API keys > anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key (server-only) | Project Settings > API > Project API keys > service_role |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | `http://localhost:3000` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for maps | (maps disabled) |
| `EMAIL_FROM_ADDRESS` | Sender email for notifications | `noreply@rento.example` |
| `SUPABASE_STORAGE_BUCKET_LISTINGS` | Storage bucket for images | `listing-media` |

## Authentication Setup

RentoH uses Supabase Auth with email/password authentication.

**Enable Email Authentication:**

1. Go to **Authentication** > **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize the "Confirm signup" and "Reset password" templates

**User Roles:**

- `tenant` (default) - Can browse properties, message landlords, submit applications
- `landlord` - Can create and manage listings, view applications
- `admin` - Full access to all features

Users can upgrade to landlord via `/onboarding/landlord` after signing in.

## Database Schema

The main tables are:

- `profiles` - User profiles with role and preferences
- `properties` - Rental listings
- `message_threads` - Conversation threads between users
- `messages` - Individual messages
- `applications` - Rental applications
- `favorites` - Saved properties
- `tour_slots` - Property tour bookings

All tables have Row Level Security (RLS) enabled for data protection.

## Storage Configuration

**Create Storage Bucket:**

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `listing-media` (or match your env var)
3. Set it to **Public** (so property images are accessible)
4. Configure RLS policies:
   ```sql
   -- Allow public reads
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'listing-media');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');
   ```

## Common Issues

### "Supabase connection inactive" Banner

This means your environment variables are not configured. Check:
1. `.env.local` exists and has the correct values
2. Variable names match exactly (including `NEXT_PUBLIC_` prefix)
3. Restart your dev server after changing env vars

### Authentication Not Working

1. Verify Supabase URL and keys are correct
2. Check that Email provider is enabled in Supabase Auth
3. Ensure you're using `.env.local` (not `.env`)
4. Clear browser cookies and try again

### Can't Create Listings

1. Verify you're signed in
2. Check that you've upgraded to landlord role
3. Verify storage bucket exists and has correct RLS policies
4. Check browser console for errors

### Database Errors

1. Ensure you've run `supabase/schema.sql`
2. Check that RLS policies are enabled
3. Verify your service role key is correct

## Development Tips

- Use `npm run build` to check for TypeScript errors
- Run `npm run lint` to check code style
- Use `npm run test` to run unit tests
- Check `npm run test:e2e` for end-to-end tests

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Project Settings
4. Deploy!

### Other Platforms

RentoH is a standard Next.js 14 app and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted with Docker

Make sure to:
- Set all required environment variables
- Use Node.js 18+
- Configure CORS in Supabase for your production domain

## Getting Help

- Check the [README.md](./README.md) for project overview
- Review [AUDIT.md](./analysis/AUDIT.md) for known issues
- Open an issue on GitHub
- Contact support@rento.example

## Security Notes

⚠️ **Never commit `.env.local` to version control**

⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code**

⚠️ **Always use RLS policies to protect data**

⚠️ **Enable 2FA on your Supabase account**
