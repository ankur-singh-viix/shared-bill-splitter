# SDE Intern Assignment: Shared Bill Splitter

Welcome. In this assignment you build a small bill splitter for a shared home. It has two parts:

1. **Homes and members:** create a home and add members to it.
2. **Bill splitting:** split a bill between the members. Each member pays their own share.

The assignment is small on purpose. We want correct, safe, and clear code. We do not want many features.

## What we look at

- **Your code passes the tests.** The tests decide, not opinion. You get the visible tests. We also run extra tests that you do not see.
- **Your code is safe when things go wrong.** Wrong input, repeated requests, and two requests at the same time must not break your data.
- **Your code is typed.** Use TypeScript. Do not use `any`.
- **You understand your code.** You record a short video and explain it.

Take your time. A careful, correct solution is better than a fast one. We expect 2 to 3 days of real work.

## Stack (required)

- **API:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite). The binding is `DB` in `api/wrangler.jsonc`.
- **Web:** React, Vite, TanStack Router
- **Language:** TypeScript on both sides
- **Tests:** Vitest, running inside the Workers runtime
- **Quality:** Biome. `pnpm check` and `pnpm typecheck` must pass.

You choose the rest (styling, form library, validation library). Pick tools you can explain.

## The task

The assignment has two parts. Do Part 1 first. Part 2 builds on it.

**Database.** Write the schema as SQL migration files in `api/migrations/`. For example `0001_init.sql`. The tests apply every file in this folder. Your schema must have **at least 3 named constraints** that protect the data. For example a foreign key, a `CHECK`, or a `UNIQUE` key. Be ready to explain what each constraint stops.

**Errors.** Every error response is JSON: `{ "error": "message" }`.

## Part 1: Homes and members

Create a home and add members to it. The order in which members are added matters in Part 2.

#### `POST /api/homes`

- Request: `{ "name": string }`
- Success: `201` `{ id, name }`

#### `POST /api/homes/:homeId/members`

- Request: `{ "name": string }`
- Success: `201` `{ id, homeId, name }`
- Errors: `404` home not found

Visible tests: `api/test/homes.test.ts`.

## Part 2: Bill splitting

Add a bill to a home, split it between the members, and let each member pay their share.

All amounts are whole **cents** (integers). `100` cents is 1 dollar. Never use decimals for money.

#### `POST /api/homes/:homeId/bills`

- Request: `{ "title": string, "totalCents": number, "currency"?: "INR" | "USD" }` (`currency` defaults to `USD`)
- Success: `201` `{ id, homeId, title, totalCents, currency, shares: [{ id, memberId, amountCents, paidAt: null }] }`
- Errors: `404` home not found. `422` total is not a positive whole number, the currency is not supported, or the home has no members.

#### `POST /api/bills/:billId/shares/:shareId/pay`

- Request: header `Idempotency-Key`
- Success: `200` `{ id, memberId, amountCents, paidAt }`
- Errors: `400` key missing. `404` bill or share not found. `409` share already paid with a different key.

#### `GET /api/homes/:homeId/balances`

- Success: `200` `{ balances: [{ memberId, name, outstandingCents }] }` (unpaid `USD` shares only, see Decisions)
- With `?groupBy=currency`: `200` `{ balances: [{ memberId, name, outstandingByCurrency: { INR, USD } }] }`
- Errors: `404` home not found

**Rules**

- **Split.** A bill is split between all members of the home. The shares always add up to `totalCents`. If the amount does not divide evenly, the extra cents go to the members one by one, in the order the members were added to the home. Example: 1000 cents between 3 members gives `334`, `333`, `333`.
- **Pay.** Paying marks one share as paid and sets `paidAt`. If the same `Idempotency-Key` is sent again for the same share, answer `200` with the same result. Do not pay twice. If two requests pay the same share at the same time, only one may succeed.
- **Balances.** `outstandingCents` is the sum of the member's unpaid shares, across all bills of the home. List the members in the order they were added.

Visible tests: `api/test/bills.test.ts` and `api/test/payments.test.ts`.

#### Web page

Build one page that:

- shows the bills of a home and the shares of each bill,
- lets a member pay a share,
- shows clear **loading**, **empty**, and **error** states,
- keeps the share unpaid and shows an error if the payment fails.

The page must not crash when the API answers with an error or is slow.

## Cases you must handle

You must handle these cases and talk about them in your video:

1. A home with no members.
2. An amount that is zero, negative, or not a whole number.
3. An amount that does not divide evenly.
4. The same payment request sent twice.
5. Two members paying the same share at the same time.
6. A bill or share that does not exist.
7. The API answers with a 500 error or is slow. The web page must not crash.

## Run it

Prerequisites: Node.js 24.22.1 and pnpm.

```bash
git clone https://github.com/ankur-singh-viix/shared-bill-splitter
cd shared-bill-splitter
```

This is a pnpm workspace. Install once at the root.

```bash
pnpm install
pnpm dev          # api on :8787 and web on :5173
```

Open http://localhost:5173 to use the app. `/api/health` returns `{ "status": "ok" }`.

```bash
pnpm test         # run the visible tests in api/test
pnpm check        # Biome: format and lint. Must pass.
pnpm check:fix    # fix what Biome can fix
pnpm typecheck    # tsc on both packages. Must pass.
pnpm build        # production build of the web app
```

`pnpm dev` applies your migrations to a local database before it starts the API.

If pnpm says some build scripts were ignored, run `pnpm approve-builds` and allow `esbuild` and `workerd`.

When you change `api/wrangler.jsonc`, refresh the `Env` types:

```bash
pnpm --filter bill-splitter-api cf-typegen
```

## Rules for the tests

- The visible tests are in `api/test`. They all pass with the current implementation.
- Do **not** change the visible tests or `api/test/helpers.ts`. We compare them with the original.
- We run extra tests after you submit. They test the cases in "Cases you must handle" more closely.

## AI policy

You can use AI tools. Tell us which ones and where in your answers on the form.
You must understand every line you submit. We check this with your video and in a live call. "The AI wrote it" is not an answer.

## How to submit

1. Click **Use this template**, then **Create a new repository**. Make the repository **public**.
2. Build your solution in your new repository. Small, clear commits are welcome.
3. Update this README with a short section called **Decisions**. Write 3 decisions you made and why.
4. Record a video of **3 minutes or less** (Loom or unlisted YouTube). Show the architecture, the data flow, and one trade-off you made. Make sure anyone with the link can view it.
5. Paste the repository link and the video link in the application form.

We will run `pnpm install && pnpm check && pnpm typecheck && pnpm test` on your repository.

---

## Project overview

Shared Bill Splitter lets a household create a home, add members, split bills equally between them, and track who has paid. Each bill is in **INR** or **USD**, and the two currencies are never converted or added together.

### Architecture

| Part     | Location           | Notes                                                                                                        |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| API      | `api/src/index.ts` | Hono on Cloudflare Workers. Plain parameterized SQL on the `DB` D1 binding.                                  |
| Database | `api/migrations/`  | `0001_init.sql` (homes, members, bills, shares) and `0002_bill_currency.sql` (bill currency).                |
| Web      | `web/src/`         | React, Vite and TanStack Router. `api.ts` is the only file that calls `fetch`.                               |
| Tests    | `api/test/`        | Vitest in the Workers runtime. `currency.test.ts` covers currencies; the other files are the supplied tests. |

### Features

- Home and member management. Members keep their insertion order (`position`).
- Equal split in integer minor units (cents / paise). The extra units go to the earliest-added members.
- Per-bill currency (INR or USD), saved in the database. `₹1,25,000.00` and `$1,250.00` formatting through `Intl.NumberFormat`.
- Idempotent payments (`Idempotency-Key`) with an atomic conditional `UPDATE`.
- Dashboard with overview cards, members, bills, balances and settings sections.
- Dark (default) and light themes. The choice is saved in `localStorage` and applied before first paint (`web/public/theme-init.js`).
- Loading, empty, error, timeout and payment-failure states. A failed refresh keeps the last loaded data.

### Additional endpoint

`GET /api/homes/:homeId` returns `{ id, name, members, bills: [{ id, homeId, title, totalCents, currency, createdAt, shares }] }` for the web app.

### Currency

- `bills.currency` is `'INR'` or `'USD'`, protected by the named constraint `ck_bills_currency_supported`. Shares take the currency of their bill.
- Existing rows get `USD` from the column default, so data created before `0002` keeps its meaning.
- The header currency control only chooses the default for **new** bills. It never changes existing bills.
- Overview totals (billed, paid, outstanding) and member balances are always shown per currency.

### Run and test

```bash
pnpm install
pnpm dev          # applies migrations to the local D1 database, then api :8787 and web :5173
pnpm test         # Vitest
pnpm check        # Biome
pnpm typecheck
pnpm build
```

## Decisions

1. **Integer minor units everywhere.** Money is stored and calculated as whole cents or paise, and only formatted at the edge. This avoids floating-point rounding, and it makes "the shares add up to the total" an exact property.
2. **Payment safety lives in one SQL statement.** `UPDATE shares SET paid_at = ?, idempotency_key = ? WHERE id = ? AND bill_id = ? AND paid_at IS NULL` is atomic, so two simultaneous requests cannot both succeed. The affected-row count decides the answer: one row changed means paid now, zero rows means replay (same key, `200`) or conflict (other key, `409`). A unique index on the key makes the key global, and reuse on another share answers `409` instead of `500`.
3. **Bill and shares are written in one `DB.batch`.** D1 runs a batch as a single transaction, so a bill can never exist without its shares.
4. **Currencies are kept separate, with no conversion.** There is no exchange rate source and a combined total would be misleading. Balances are returned per currency.
5. **The balances endpoint keeps its original shape by default.** The supplied tests compare `{ memberId, name, outstandingCents }` exactly, so adding `outstandingByCurrency` to that response would break them. The default response therefore reports the default currency (USD) in `outstandingCents`, and the per-currency breakdown is `GET /api/homes/:homeId/balances?groupBy=currency`, which the web app uses.
6. **Section navigation is component state, not routes.** The app is one page. Only the selected home is in the URL (`?homeId=`), so a link reopens the same home.

## AI tools disclosure

I used Claude Pro in VS Code Agent mode and ChatGPT during the development of this project.

Claude was primarily used to assist with implementation, including the backend APIs, database schema, React frontend, bill-splitting logic, payment handling, currency support, and automated tests.

I used ChatGPT for understanding requirements, planning the architecture, preparing implementation prompts, reviewing code changes, identifying edge cases, and debugging.

My contribution was defining the requirements, guiding the implementation step by step, reviewing the generated changes, making technical decisions, and validating the application through manual testing and automated checks.

I paid particular attention to important edge cases, including uneven bill splitting, invalid amounts, duplicate payment requests, concurrent payment attempts, missing bills or shares, and independent INR/USD handling.

I also ran the test suite, type checks, code quality checks, and production build to verify the implementation.

I understand the architecture, API flow, database relationships, business logic, and technical trade-offs used in the project, and I am prepared to explain them during the code walkthrough or a live discussion.
