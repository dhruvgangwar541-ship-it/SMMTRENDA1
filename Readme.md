# SMMTRENDA1

Same starter design, with server-side ZapUPI payment initiation and status verification.

## Netlify environment variables
Set these in Netlify for the new site (Production and Deploy Previews as needed):
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (server-side only)
- `ZAPUPI_API_KEY` — ZapUPI API key (server-side only)
- `VITE_SUPABASE_URL` — same Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` — same Supabase anon/public key (frontend)

Never put `SUPABASE_SERVICE_ROLE_KEY` or `ZAPUPI_API_KEY` in a `VITE_` variable or frontend file.

## Database
1. Create the Supabase project.
2. Run `schema.sql` in Supabase SQL Editor.
3. Run `supabase-payment-migration.sql` in Supabase SQL Editor.

## Build and deploy
Netlify build command: `npm run build`
Publish directory: `dist`
Functions directory: `netlify/functions`

## Important payment notes
- The server creates the order using a server-side service catalogue and amount. The browser cannot set the amount.
- Payment status is checked directly with ZapUPI's order-status API. A browser redirect alone is not treated as proof.
- This starter marks the order `paid` only after matching the returned order ID and amount.
- No wallet tables or wallet credits are implemented because the supplied project schema has no wallet definition. Do not use this as a wallet-crediting system until a database-specific atomic credit procedure is designed and reviewed.
- No webhook is trusted or enabled. The supplied ZapUPI documentation details did not establish webhook authentication/signature verification. Ask ZapUPI support to confirm official webhook authentication before using webhook notifications.
- Test with a small amount in the provider's test/sandbox environment before accepting real payments.
