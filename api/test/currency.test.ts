import { describe, expect, it } from 'vitest'
import { type Bill, call, createBill, createHome, type Share } from './helpers'

type CurrencyBalances = {
  balances: {
    memberId: string
    name: string
    outstandingByCurrency: { INR: number; USD: number }
  }[]
}

function createBillIn(homeId: string, totalCents: number, currency?: unknown) {
  return call<Bill & { currency: string }>('POST', `/api/homes/${homeId}/bills`, {
    body: { title: 'Rent', totalCents, currency },
  })
}

function byCurrency(homeId: string) {
  return call<CurrencyBalances>('GET', `/api/homes/${homeId}/balances?groupBy=currency`)
}

describe('bill currency', () => {
  it('defaults to USD when the currency is omitted', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])

    const bill = await createBill(homeId, 1000)

    expect(bill.body).toMatchObject({ currency: 'USD' })
  })

  it.each(['INR', 'USD'])('stores a %s bill and splits it the same way', async (currency) => {
    const { homeId } = await createHome(['Asha', 'Ben', 'Chitra'])

    const bill = await createBillIn(homeId, 1000, currency)

    expect(bill.status).toBe(201)
    expect(bill.body.currency).toBe(currency)
    expect(bill.body.shares.map((share) => share.amountCents)).toEqual([334, 333, 333])
  })

  it.each(['EUR', 'inr', '', 5, null])('rejects the currency %j', async (currency) => {
    const { homeId } = await createHome(['Asha'])

    const bill = await createBillIn(homeId, 1000, currency)

    expect(bill.status).toBe(422)
    expect(bill.body).toHaveProperty('error')
  })

  it('returns the currency of each bill in the home details', async () => {
    const { homeId } = await createHome(['Asha'])
    await createBillIn(homeId, 100, 'INR')
    await createBillIn(homeId, 200, 'USD')

    const home = await call<{ bills: { currency: string; totalCents: number }[] }>(
      'GET',
      `/api/homes/${homeId}`,
    )

    expect(home.body.bills.map((bill) => [bill.currency, bill.totalCents]).sort()).toEqual([
      ['INR', 100],
      ['USD', 200],
    ])
  })
})

describe('currency balances', () => {
  it('keeps INR and USD outstanding amounts separate, in member order', async () => {
    const { homeId, members } = await createHome(['Asha', 'Ben'])
    await createBillIn(homeId, 1000, 'INR')
    await createBillIn(homeId, 301, 'USD')

    const balances = await byCurrency(homeId)

    expect(balances.status).toBe(200)
    expect(balances.body.balances).toEqual([
      { memberId: members[0]?.id, name: 'Asha', outstandingByCurrency: { INR: 500, USD: 151 } },
      { memberId: members[1]?.id, name: 'Ben', outstandingByCurrency: { INR: 500, USD: 150 } },
    ])
  })

  it('lists members with no bills as zero in both currencies', async () => {
    const { homeId } = await createHome(['Asha'])

    const balances = await byCurrency(homeId)

    expect(balances.body.balances.map((balance) => balance.outstandingByCurrency)).toEqual([
      { INR: 0, USD: 0 },
    ])
  })

  it('reduces only the currency of the bill that was paid', async () => {
    const { homeId } = await createHome(['Asha'])
    const inr = await createBillIn(homeId, 700, 'INR')
    await createBillIn(homeId, 300, 'USD')
    const share = inr.body.shares[0]
    if (!share) throw new Error('bill has no shares')

    const paid = await call<Share>('POST', `/api/bills/${inr.body.id}/shares/${share.id}/pay`, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
    const balances = await byCurrency(homeId)

    expect(paid.status).toBe(200)
    expect(balances.body.balances[0]?.outstandingByCurrency).toEqual({ INR: 0, USD: 300 })
  })

  it('does not add INR amounts to the default outstandingCents', async () => {
    const { homeId } = await createHome(['Asha'])
    await createBillIn(homeId, 700, 'INR')
    await createBillIn(homeId, 300, 'USD')

    const balances = await call<{ balances: { outstandingCents: number }[] }>(
      'GET',
      `/api/homes/${homeId}/balances`,
    )

    expect(balances.body.balances.map((balance) => balance.outstandingCents)).toEqual([300])
  })
})
