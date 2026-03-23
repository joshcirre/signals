# Signals

Signals is a Laravel + Inertia demo that shows how a hosted commerce app can hand work off to a local Codex helper through Laravel MCP, stream that work back into the app, and keep all customer-facing changes proposal-gated.

## What This Demo Shows

- Fortify auth with a real admin workflow
- Persisted storefront, reviews, proposals, runs, and audit logs
- Laravel MCP tools, prompts, and resources exposed by the app
- A local Node helper that starts Codex on the operator's machine
- Live streamed run events over Laravel Reverb
- Proposal approval that updates the public storefront

## Demo Stack

- Hosted Laravel app for auth, MCP, persistence, and Reverb
- Public storefront for the before/after payoff
- Authenticated `/admin/signals` control room
- Local `desktop-helper` that runs Codex against the hosted app

## Quick Start

### Local Development

```bash
composer install
npm install
php artisan key:generate
php artisan migrate:fresh --seed
npm install --prefix desktop-helper
```

Run the app:

```bash
npm run dev
php artisan queue:listen --tries=1 --timeout=0
php artisan reverb:start
```

Seeded login:

- `admin@example.com`
- `password`

### Codex Helper Prerequisites

Install the Codex CLI locally and sign in first.

```bash
npm install -g @openai/codex
codex login
```

## Hosted Demo Setup

Deploy the Laravel app, configure MySQL, queues, and Reverb, then run:

```bash
php artisan migrate --force
php artisan signals:seed-demo --force
php artisan signals:check-hosted-deployment
```

The hosted demo assumes:

- `APP_URL` points at the live site, for example `https://signals.joshcirre.com`
- `BROADCAST_CONNECTION=reverb`
- `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT`, and `REVERB_SCHEME` are set correctly
- queue workers and Reverb are running

For the current hosted demo environment:

- Site URL: `https://signals.joshcirre.com`
- Reverb host: `ws-a15d989a-db9e-4e70-88eb-efcb7e6d3b4f-reverb.laravel.cloud`
- Reverb runs over `https` on port `443`

Important:

- The browser uses the hosted app's Reverb configuration automatically.
- The local Node helper does not need any `REVERB_*` environment variables.
- The helper only needs `SIGNALS_SERVER_URL` and the issued `SIGNALS_DEVICE_TOKEN`.

## Hourly Demo Reset

The app schedules a production-only hourly reset of the shared storefront dataset:

```php
Schedule::command('signals:seed-demo --force')->hourly()
```

This keeps the storefront, reviews, pending proposals, and seeded audit trail in a known state for hackathon visitors.

If your hosting platform needs an external scheduler, make sure Laravel's scheduler is running every minute:

```bash
php artisan schedule:run
```

On Laravel Cloud, configure the scheduler normally and the hourly Signals reset will run automatically.

## Self-Serve Hackathon Flow

Any newly registered account is created as a verified merchant admin so the demo can be run immediately.

From a fresh machine:

```bash
git clone https://github.com/joshcirre/signals.git
cd signals
npm install --prefix desktop-helper
```

Then:

1. Create an account or sign in.
2. Open `/admin/signals`.
3. Issue a helper token.
4. Copy the run command shown in the UI.
5. Start the helper locally.
6. Click `Analyze New Reviews`.
7. Approve a proposal.
8. Open the public product page to show the storefront update.

## Local Helper

The helper lives in `desktop-helper/` and is intentionally simple.

Run it with the token from `/admin/signals`:

```bash
SIGNALS_SERVER_URL=https://signals.joshcirre.com \
SIGNALS_DEVICE_TOKEN=your-issued-token \
node desktop-helper/index.mjs
```

Optional helper environment variables:

- `SIGNALS_CODEX_MODEL`
- `SIGNALS_CODEX_REASONING_EFFORT`
- `SIGNALS_POLL_INTERVAL_MS`
- `SIGNALS_RUN_ONCE`

## Demo Script

Recommended 5-minute flow:

1. Show the public storefront and the Premium Hoodie before the fit note exists.
2. Sign in and open `/admin/signals`.
3. Search for hoodie sizing feedback.
4. Show the helper install/run commands.
5. Start the local helper.
6. Trigger `Analyze New Reviews`.
7. Narrate the live MCP-backed stream as Codex inspects tools and resources.
8. Approve the fit note proposal.
9. Refresh the public product page and show the update live.
10. Finish on the audit log or proposal queue.

## Useful Commands

```bash
php artisan signals:seed-demo --force
php artisan signals:check-hosted-deployment
php artisan signals:smoke-codex-mcp admin@example.com --server-url=https://signals.joshcirre.com --timeout=180
composer test
composer run refactor:check
```

## Notes

- The hourly reset is intended for the shared hackathon environment.
- The local helper is the only piece that runs on the operator's machine.
- Customer-visible changes are still proposal-based and require approval in the app.
