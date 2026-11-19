# Fan Sessions

Paid 1:1 video calls between creators and fans, booked and paid on Fanvue.

## Phase 1 (this version)

- Sign in with Fanvue (OAuth 2.0 + PKCE), tokens stored encrypted
- Creator settings: accept bookings on/off, packages (length + price), weekly hours, time zone, break between calls
- `/api/health` shows which environment variables are set (never their values)

## Setup

1. Supabase → SQL Editor → run `supabase/schema.sql`.
2. Vercel → import this repo → add the variables from `.env.example`.
3. Fanvue → fanvue.com/dev → create an app → Authentication tab:
   - Redirect URI: `<APP_URL>/api/auth/callback`
   - Scopes: `read:self`
   - Copy Client ID and Client Secret into Vercel.
4. Redeploy, open the app and click **Connect with Fanvue**.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```
