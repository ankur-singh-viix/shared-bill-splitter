export const CURRENCIES = ['INR', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

export type Member = { id: string; name: string }
export type Share = { id: string; memberId: string; amountCents: number; paidAt: string | null }
export type Bill = {
  id: string
  homeId: string
  title: string
  totalCents: number
  currency: Currency
  createdAt: string
  shares: Share[]
}
export type HomeDetails = { id: string; name: string; members: Member[]; bills: Bill[] }
/** Unpaid amounts in minor units (cents / paise). The two currencies are never combined. */
export type Balance = {
  memberId: string
  name: string
  outstandingByCurrency: Record<Currency, number>
}

const REQUEST_TIMEOUT_MS = 15_000

/** The server answered with an error status. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** The request never produced a usable answer (offline, timeout, unreadable body). */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    if (typeof body.error === 'string') return body.error
  }
  return `Request failed with status ${status}`
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  options: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(path, {
      method,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    const text = await response.text()
    let parsed: unknown = null
    try {
      parsed = JSON.parse(text)
    } catch {
      // A non-JSON body (for example a proxy error page) is handled below.
    }
    if (!response.ok) throw new ApiError(response.status, errorMessage(parsed, response.status))
    if (parsed === null) throw new NetworkError('The server sent an unreadable response.')
    return parsed as T
  } catch (err) {
    if (err instanceof ApiError || err instanceof NetworkError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NetworkError('The server took too long to respond.')
    }
    throw new NetworkError('Could not reach the server. Check your connection.')
  } finally {
    clearTimeout(timer)
  }
}

export function describeError(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.'
}

const homePath = (homeId: string) => `/api/homes/${encodeURIComponent(homeId)}`

export const api = {
  createHome: (name: string) =>
    request<{ id: string; name: string }>('POST', '/api/homes', { body: { name } }),
  getHome: (homeId: string) => request<HomeDetails>('GET', homePath(homeId)),
  addMember: (homeId: string, name: string) =>
    request<{ id: string; homeId: string; name: string }>('POST', `${homePath(homeId)}/members`, {
      body: { name },
    }),
  createBill: (homeId: string, title: string, totalCents: number, currency: Currency) =>
    request<Bill>('POST', `${homePath(homeId)}/bills`, { body: { title, totalCents, currency } }),
  getBalances: (homeId: string) =>
    request<{ balances: Balance[] }>('GET', `${homePath(homeId)}/balances?groupBy=currency`),
  payShare: (billId: string, shareId: string, idempotencyKey: string) =>
    request<Share>(
      'POST',
      `/api/bills/${encodeURIComponent(billId)}/shares/${encodeURIComponent(shareId)}/pay`,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),
}
