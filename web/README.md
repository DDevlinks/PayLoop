# PayLoop Web

Next.js (App Router) frontend for PayLoop — invoice foreign clients in USDC on
Stellar, cash out in Naira.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- `@stellar/stellar-sdk` for on-chain calls
- `@stellar/freighter-api` + `@creit.tech/stellar-wallets-kit` for wallet adapters (Freighter, xBull, Albedo, Lobstr, Hana)
- Vercel Analytics + Sentry for monitoring

## Local development

```bash
cp .env.example .env.local   # optional: testnet defaults are baked in
npm install
npm run dev                  # http://localhost:3000
```

The public contract/token addresses default to the live testnet deployment, so
the app runs against the real contract with no config. Override via `.env.local`
to point at a different deployment. The faucet button needs
`USDC_ISSUER_SECRET` set server-side.

You'll need a supported Stellar wallet set to **Testnet**: Freighter, xBull,
Albedo, Lobstr or Hana. Choose it from the wallet picker when connecting.

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTRACT_ID` | public | Invoice contract address |
| `NEXT_PUBLIC_TOKEN_ID` | public | Test USDC Stellar Asset Contract |
| `NEXT_PUBLIC_TOKEN_DECIMALS` | public | Default token decimals (7); actual values are read from each token contract |
| `NEXT_PUBLIC_TOKENS` | public | Optional JSON array of extra allowlisted tokens: `[{"id":"C…","issuer":"G…","symbol":"USDY","decimals":6}]`. The default token is always included. Its `symbol`/`decimals` are public fallbacks; the current values come from the token contract. |
| `NEXT_PUBLIC_RPC_URL` | public | Soroban RPC endpoint |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | public | Network passphrase |
| `USDC_ISSUER_SECRET` | **server only** | Issuer secret key for the test-USDC faucet. Never prefix with `NEXT_PUBLIC`. |
| `FEEDBACK_WEBHOOK_URL` | **server only** | Optional. Webhook (Slack/Discord/Zapier) that `/api/feedback` forwards submissions to. |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | mixed | Optional monitoring; build works without them |

Testnet defaults for the public vars are baked into `.env.example`.

## Routes

- `/` — landing page
- `/create` — freelancer creates an invoice in the default or another allowlisted token (signs one tx)
- `/dashboard` — freelancer's invoices, balances, test-USDC faucet
- `/pay/[id]` — client-facing payment page; funds the invoice in one click
- `/statement` — printable income statement (paid invoices for a date range, with totals and verification links)
- `/withdraw` — mocked USDC→Naira off-ramp
- `/activity` — public on-chain feed of every invoice + usage stats
- `/api/faucet` — server route that mints test USDC (holds the issuer key)
- `/api/feedback` — collects user feedback, forwards to an optional webhook

## The faucet

`/api/faucet` mints test USDC to a wallet by calling `mint` on the SAC as the
asset issuer. The issuer secret stays server-side. In production this route
would be removed — it exists only so demo users can get testnet balances.

## The Naira off-ramp is mocked

`/withdraw` simulates a licensed anchor (SEP-24) end to end: it validates the
amount against your balance, shows the NGN conversion, and returns a reference.
**No real bank transfer happens and no on-chain funds move.** See
[`../docs/ANCHOR.md`](../docs/ANCHOR.md) for how this would connect to a real
anchor.

## Upgrading the Stellar SDK

`@stellar/stellar-sdk` is pinned to an exact version in `package.json` (no `^`
or `~`) and must stay that way. The SDK has to match the protocol version of
the network it talks to: a mismatch can make every transaction fail with
hard-to-diagnose errors such as "Bad union switch", with no change to our code.
A routine `npm install` must never move it.

To upgrade deliberately:

1. Check the network's current protocol version:

   ```bash
   curl -s https://horizon-testnet.stellar.org/ | grep protocol_version
   ```

   (`current_protocol_version` is what the network runs now.)
2. Read the SDK release notes for the target version and confirm it supports
   that protocol.
3. Change the version in `package.json` to the exact new version, then refresh
   the lockfile with `npm install --package-lock-only` and review the diff.
4. Run `npm ci`, `npm run lint` and `npm run build`.
5. Test by hand against testnet before merging: connect a supported wallet, create an
   invoice, fund it from a second wallet, and open History and Activity. These
   exercise simulate, sign and submit, and the read paths.

Mention the old and new SDK version and the protocol version you checked in the
pull request. Other PRs that touch `package.json` may conflict with an upgrade;
land the upgrade on its own.

## Deploy

Configured for Vercel. Set the env vars in the Vercel project settings, then:

```bash
vercel --prod
```
