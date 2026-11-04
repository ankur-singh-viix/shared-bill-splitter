import { Hono } from 'hono'

type NameBody = { name: string }

const MAX_NAME_LENGTH = 100

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Returns the trimmed name from a JSON body, or null if the body is not valid.
async function readName(request: Request): Promise<NameBody | null> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return null
  }
  if (typeof body !== 'object' || body === null || !('name' in body)) return null
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null
  return { name }
}

const INVALID_NAME = `name must be a non-empty string of at most ${MAX_NAME_LENGTH} characters`

app.post('/api/homes', async (c) => {
  const parsed = await readName(c.req.raw)
  if (!parsed) return c.json({ error: INVALID_NAME }, 400)

  const id = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO homes (id, name) VALUES (?, ?)').bind(id, parsed.name).run()
  return c.json({ id, name: parsed.name }, 201)
})

app.post('/api/homes/:homeId/members', async (c) => {
  const homeId = c.req.param('homeId')

  const home = await c.env.DB.prepare('SELECT id FROM homes WHERE id = ?').bind(homeId).first()
  if (!home) return c.json({ error: 'Home not found' }, 404)

  const parsed = await readName(c.req.raw)
  if (!parsed) return c.json({ error: INVALID_NAME }, 400)

  // The position is computed inside the INSERT so concurrent requests cannot read the same value;
  // uq_members_home_position rejects any collision that still slips through.
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO members (id, home_id, name, position)
     SELECT ?, ?, ?, COALESCE(MAX(position), 0) + 1 FROM members WHERE home_id = ?`,
  )
    .bind(id, homeId, parsed.name, homeId)
    .run()
  return c.json({ id, homeId, name: parsed.name }, 201)
})

type ShareResponse = { id: string; memberId: string; amountCents: number; paidAt: null }

const MAX_TITLE_LENGTH = 200

const CURRENCIES = ['INR', 'USD'] as const
type Currency = (typeof CURRENCIES)[number]
const DEFAULT_CURRENCY: Currency = 'USD'

function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.some((currency) => currency === value)
}

// Splits totalCents across memberIds in order; the first (total % N) members get one extra cent.
function splitBill(totalCents: number, memberIds: string[]): ShareResponse[] {
  const baseShare = Math.floor(totalCents / memberIds.length)
  const remainder = totalCents % memberIds.length
  return memberIds.map((memberId, i) => ({
    id: crypto.randomUUID(),
    memberId,
    amountCents: baseShare + (i < remainder ? 1 : 0),
    paidAt: null,
  }))
}

app.post('/api/homes/:homeId/bills', async (c) => {
  const homeId = c.req.param('homeId')

  const home = await c.env.DB.prepare('SELECT id FROM homes WHERE id = ?').bind(homeId).first()
  if (!home) return c.json({ error: 'Home not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }
  if (typeof body !== 'object' || body === null) {
    return c.json({ error: 'Request body must be a JSON object' }, 400)
  }

  const title = 'title' in body && typeof body.title === 'string' ? body.title.trim() : ''
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    return c.json(
      { error: `title must be a non-empty string of at most ${MAX_TITLE_LENGTH} characters` },
      422,
    )
  }

  const totalCents = 'totalCents' in body ? body.totalCents : undefined
  if (typeof totalCents !== 'number' || !Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return c.json({ error: 'totalCents must be a positive integer' }, 422)
  }

  // Omitted currency keeps the pre-currency behaviour (USD); anything else must be supported.
  const currency = 'currency' in body ? body.currency : DEFAULT_CURRENCY
  if (!isCurrency(currency)) {
    return c.json({ error: `currency must be one of ${CURRENCIES.join(', ')}` }, 422)
  }

  const { results: members } = await c.env.DB.prepare(
    'SELECT id FROM members WHERE home_id = ? ORDER BY position ASC',
  )
    .bind(homeId)
    .all<{ id: string }>()
  if (members.length === 0) {
    return c.json({ error: 'Home has no members to split the bill between' }, 422)
  }

  const billId = crypto.randomUUID()
  const shares = splitBill(
    totalCents,
    members.map((member) => member.id),
  )

  // D1 runs a batch as a single transaction, so the bill and its shares are saved together or not at all.
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO bills (id, home_id, title, total_cents, currency) VALUES (?, ?, ?, ?, ?)',
    ).bind(billId, homeId, title, totalCents, currency),
    ...shares.map((share) =>
      c.env.DB.prepare(
        'INSERT INTO shares (id, bill_id, member_id, amount_cents) VALUES (?, ?, ?, ?)',
      ).bind(share.id, billId, share.memberId, share.amountCents),
    ),
  ])

  return c.json({ id: billId, homeId, title, totalCents, currency, shares }, 201)
})

type PaidShareRow = {
  id: string
  member_id: string
  amount_cents: number
  paid_at: string | null
  idempotency_key: string | null
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && err.message.includes('UNIQUE constraint failed')
}

// Idempotency-Key is unique across all shares (uq_shares_idempotency_key), so a key identifies one
// payment. Reusing it for a different share is a client error and answers 409 instead of a 500.
app.post('/api/bills/:billId/shares/:shareId/pay', async (c) => {
  const billId = c.req.param('billId')
  const shareId = c.req.param('shareId')

  const key = c.req.header('Idempotency-Key')?.trim()
  if (!key) return c.json({ error: 'Idempotency-Key header is required' }, 400)

  // Atomic conditional update: only one concurrent request can flip paid_at from NULL.
  let paidNow = false
  try {
    const result = await c.env.DB.prepare(
      `UPDATE shares SET paid_at = ?, idempotency_key = ?
       WHERE id = ? AND bill_id = ? AND paid_at IS NULL`,
    )
      .bind(new Date().toISOString(), key, shareId, billId)
      .run()
    paidNow = result.meta.changes === 1
  } catch (err) {
    if (isUniqueViolation(err)) {
      return c.json({ error: 'Idempotency-Key was already used for another payment' }, 409)
    }
    throw err
  }

  const share = await c.env.DB.prepare(
    `SELECT id, member_id, amount_cents, paid_at, idempotency_key
     FROM shares WHERE id = ? AND bill_id = ?`,
  )
    .bind(shareId, billId)
    .first<PaidShareRow>()
  if (!share) return c.json({ error: 'Share not found' }, 404)

  // Not updated by this request: a replay with the same key succeeds, any other key conflicts.
  if (!paidNow && share.idempotency_key !== key) {
    return c.json({ error: 'Share has already been paid' }, 409)
  }

  return c.json(
    {
      id: share.id,
      memberId: share.member_id,
      amountCents: share.amount_cents,
      paidAt: share.paid_at,
    },
    200,
  )
})

type BalanceRow = { memberId: string; name: string; inr: number; usd: number }

// Unpaid shares per member, summed separately per currency (currencies are never combined).
// Default shape is the original contract: outstandingCents counts the default currency (USD) only.
// `?groupBy=currency` returns every currency as { outstandingByCurrency: { INR, USD } }.
app.get('/api/homes/:homeId/balances', async (c) => {
  const homeId = c.req.param('homeId')

  const home = await c.env.DB.prepare('SELECT id FROM homes WHERE id = ?').bind(homeId).first()
  if (!home) return c.json({ error: 'Home not found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT m.id AS memberId, m.name AS name,
       COALESCE(SUM(CASE WHEN b.currency = 'INR' THEN s.amount_cents END), 0) AS inr,
       COALESCE(SUM(CASE WHEN b.currency = 'USD' THEN s.amount_cents END), 0) AS usd
     FROM members m
     LEFT JOIN shares s ON s.member_id = m.id AND s.paid_at IS NULL
     LEFT JOIN bills b ON b.id = s.bill_id AND b.home_id = m.home_id
     WHERE m.home_id = ?
     GROUP BY m.id, m.name, m.position
     ORDER BY m.position ASC`,
  )
    .bind(homeId)
    .all<BalanceRow>()

  if (c.req.query('groupBy') === 'currency') {
    return c.json({
      balances: results.map((row) => ({
        memberId: row.memberId,
        name: row.name,
        outstandingByCurrency: { INR: row.inr, USD: row.usd },
      })),
    })
  }
  return c.json({
    balances: results.map((row) => ({
      memberId: row.memberId,
      name: row.name,
      outstandingCents: row.usd,
    })),
  })
})

type MemberRow = { id: string; name: string }
type BillRow = {
  id: string
  title: string
  total_cents: number
  currency: Currency
  created_at: string
}
type BillShareRow = {
  id: string
  bill_id: string
  member_id: string
  amount_cents: number
  paid_at: string | null
}

// Read-only snapshot of a home for the web app: members, then bills (newest first) with shares.
app.get('/api/homes/:homeId', async (c) => {
  const homeId = c.req.param('homeId')

  const home = await c.env.DB.prepare('SELECT id, name FROM homes WHERE id = ?')
    .bind(homeId)
    .first<{ id: string; name: string }>()
  if (!home) return c.json({ error: 'Home not found' }, 404)

  const [members, bills, shares] = await c.env.DB.batch<MemberRow | BillRow | BillShareRow>([
    c.env.DB.prepare('SELECT id, name FROM members WHERE home_id = ? ORDER BY position ASC').bind(
      homeId,
    ),
    c.env.DB.prepare(
      `SELECT id, title, total_cents, currency, created_at FROM bills
       WHERE home_id = ? ORDER BY created_at DESC, rowid DESC`,
    ).bind(homeId),
    c.env.DB.prepare(
      `SELECT s.id, s.bill_id, s.member_id, s.amount_cents, s.paid_at
       FROM shares s
       JOIN bills b ON b.id = s.bill_id
       JOIN members m ON m.id = s.member_id
       WHERE b.home_id = ? ORDER BY m.position ASC`,
    ).bind(homeId),
  ])

  const shareRows = (shares?.results ?? []) as BillShareRow[]
  return c.json({
    id: home.id,
    name: home.name,
    members: (members?.results ?? []) as MemberRow[],
    bills: ((bills?.results ?? []) as BillRow[]).map((bill) => ({
      id: bill.id,
      homeId,
      title: bill.title,
      totalCents: bill.total_cents,
      currency: bill.currency,
      createdAt: bill.created_at,
      shares: shareRows
        .filter((share) => share.bill_id === bill.id)
        .map((share) => ({
          id: share.id,
          memberId: share.member_id,
          amountCents: share.amount_cents,
          paidAt: share.paid_at,
        })),
    })),
  })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
