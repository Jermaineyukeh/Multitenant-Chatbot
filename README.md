# Multi-Tenant WhatsApp/Instagram Chatbot

One backend, unlimited client bots. Each client gets their own configuration
(business info, tone, FAQs, escalation rules) stored in a database you
don't write new code per client, you just add a row.

## What's included
- `server.js` — main app
- `db/` — SQLite database (auto-created on first run, zero setup)
- `services/ai.js` — builds the per-client prompt and calls Claude
- `services/clients.js` — manage client (tenant) configs
- `services/conversations.js` — stores chat history per customer per client
- `services/messenger.js` — sends replies back via WhatsApp/Instagram
- `routes/whatsapp.js`, `routes/instagram.js` — webhooks Meta calls when a customer messages
- `routes/admin.js`, `routes/auth.js` — protected API for managing clients
- `public/index.html` — simple dashboard to add/edit client bots (no coding needed after setup)

---

## PART 1 — Get it running locally (to test)

### 1. Install Node.js
Download and install Node.js 20+ from https://nodejs.org if you don't have it.

### 2. Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### 3. Set up your environment file
Copy `.env.example` to `.env`:
```
cp .env.example .env
```
Open `.env` and fill in:
- `JWT_SECRET` — any long random string (used to secure admin logins)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the login you'll use for the dashboard
- `ANTHROPIC_API_KEY` — get this from https://console.anthropic.com (Settings > API Keys). This is what powers the AI replies, and you're billed per usage — budget a few cents per conversation.

Leave the WhatsApp/Instagram fields for now — you'll fill those in **per client**, inside the dashboard, not the .env file (that's the whole point of multi-tenant: each client's tokens live in the database, not in code).

### 4. Run it
```
npm start
```
Visit `http://localhost:3000` in your browser — you should see the login screen. Log in with the email/password you set in `.env`.

At this point you can add a test client and see the dashboard work, but messages won't flow yet because WhatsApp/Instagram need a real public URL to send webhooks to (see Part 3).

---

## PART 2 — Set up Meta (WhatsApp + Instagram) access

This is the part that's genuinely fiddly — budget an afternoon the first time. After that, connecting each new client takes ~10 minutes.

### A. Create a Meta Developer app (one-time, for YOU)
1. Go to https://developers.facebook.com and create a developer account if you don't have one.
2. Create a new App → choose type **"Business"**.
3. In the app dashboard, add the **WhatsApp** product and the **Instagram** product (via Messenger/Graph API).

### B. Per-client setup (repeat for each of your 20 clients)
Each client needs their own connection, because each has their own WhatsApp number and Instagram account.

**For WhatsApp:**
1. In Meta Business Manager, the client either gives you access to their WhatsApp Business Account (WABA), or you create one under your Business Manager and add their phone number.
2. Under your app's WhatsApp > API Setup, you'll get a **Phone Number ID** and a temporary **Access Token** for that number. For production, generate a **permanent token** (System User token) instead — Meta's docs walk through this under "System Users."
3. Under **Configuration**, set the webhook URL to:
   `https://YOUR-DOMAIN.com/whatsapp/webhook`
   and the **Verify Token** to whatever you set as `WHATSAPP_VERIFY_TOKEN` in `.env`.
4. Subscribe the webhook to the `messages` field.
5. Copy the **Phone Number ID** and **Access Token** into that client's profile in your dashboard.

**For Instagram:**
1. The client's Instagram account must be a **Professional (Business/Creator) account**, connected to a **Facebook Page**.
2. In your Meta app, add the client's Page under Instagram > API Setup, generate a **Page Access Token**.
3. Set the webhook URL to:
   `https://YOUR-DOMAIN.com/instagram/webhook`
   with your `IG_VERIFY_TOKEN`, subscribed to the `messages` field.
4. Copy the **Page ID** and **Page Access Token** into that client's profile in your dashboard.

**Note on WhatsApp's 24-hour rule:** you can only send free-form replies within 24 hours of the customer's last message. Outside that window, you need a pre-approved message template. This bot handles the normal reply flow; template messages for re-engagement are a separate feature you'd add later if needed.

---

## PART 3 — Deploy it so Meta can actually reach it

Meta's webhooks need a real public HTTPS URL — `localhost` won't work. Pick one:

**Easiest: Railway or Render**
1. Push this folder to a GitHub repository.
2. Create an account at https://railway.app or https://render.com, connect your GitHub repo.
3. Set the environment variables from your `.env` file in their dashboard (never commit `.env` to GitHub).
4. Deploy — they'll give you a public URL like `https://yourapp.up.railway.app`.
5. Use that URL (+ `/whatsapp/webhook` or `/instagram/webhook`) in Meta's webhook configuration.

**Note on the database:** this uses SQLite (a single file) for simplicity — fine for getting started with ~20 clients. Railway/Render's filesystem can reset on redeploy, so once you're live, either use their "persistent volume" option, or migrate to a hosted Postgres (I can help with that swap when you're ready — it's a small change to `db/index.js`).

**More control: a VPS (DigitalOcean, AWS EC2, etc.)**
1. Spin up a small Ubuntu server.
2. Install Node.js, clone your repo, run `npm install`, set up `.env`.
3. Use `pm2` to keep it running: `npm install -g pm2 && pm2 start server.js`.
4. Put it behind a domain with HTTPS — easiest via Caddy or Nginx + Certbot (free SSL).

---

## PART 4 — Onboarding a new client (your day-to-day workflow)

Once deployed, adding a new client is just:
1. Log into your dashboard.
2. Click **+ Add client**, fill in their business name, tone, FAQs, and business hours.
3. Follow Part 2B above to connect their WhatsApp number and/or Instagram account, and paste the resulting IDs/tokens into their profile.
4. Save — their bot is live.

No code changes, no redeploying, per client.

---

## Costs to expect
- **Anthropic API**: usage-based, roughly fractions of a cent per message with Claude Sonnet — track usage in the Anthropic Console.
- **WhatsApp Business API**: Meta charges per conversation (varies by country) after a free tier of conversations per month.
- **Hosting**: Railway/Render free tiers work for testing; expect ~$5–20/month once live with real traffic.

## Sensible next steps once this is working
- Add a way for clients to view/reply to their own conversations from the dashboard (currently admin-only).
- Swap SQLite for Postgres once you're past a handful of clients or need it on Railway/Render's ephemeral filesystem.
- Add per-client usage tracking so you can bill accurately.
- Add retrieval (RAG) for clients with large product catalogs, instead of a flat FAQ list.
