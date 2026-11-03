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

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
