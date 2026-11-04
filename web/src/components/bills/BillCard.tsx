import type { Bill, Member } from '../../api'
import { formatDate, formatMoney, initials } from '../../format'
import { Icon } from '../Icon'

type Props = {
  bill: Bill
  members: Member[]
  payingShareId: string | null
  /** The share that was just paid; it gets a short confirmation animation. */
  paidShareId: string | null
  onPay: (billId: string, shareId: string) => void
}

export function BillCard({ bill, members, payingShareId, paidShareId, onPay }: Props) {
  const names = new Map(members.map((member) => [member.id, member.name]))
  const paidCount = bill.shares.filter((share) => share.paidAt).length
  const percent = bill.shares.length === 0 ? 0 : Math.round((paidCount / bill.shares.length) * 100)
  const settled = bill.shares.length > 0 && paidCount === bill.shares.length
  const date = formatDate(bill.createdAt)

  return (
    <article className="card lift bill-card">
      <header className="bill-head">
        <div className="bill-title">
          <h3 title={bill.title}>{bill.title}</h3>
          <p className="muted">
            {date ?? 'No date'} · <span className="currency-tag">{bill.currency}</span>
          </p>
        </div>
        <div className="bill-amount">
          <strong>{formatMoney(bill.totalCents, bill.currency)}</strong>
          <span className={settled ? 'badge badge-ok' : 'badge badge-warn'}>
            {settled ? 'Settled' : `${paidCount} of ${bill.shares.length} paid`}
          </span>
        </div>
      </header>

      <div
        className="progress"
        role="progressbar"
        aria-label={`${bill.title} payment progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <ul className="shares">
        {bill.shares.map((share) => {
          const name = names.get(share.memberId) ?? 'Unknown member'
          const paying = payingShareId === share.id
          const justPaid = paidShareId === share.id
          return (
            <li key={share.id} className={justPaid ? 'share share-flash' : 'share'}>
              <span className="avatar avatar-sm">{initials(name)}</span>
              <span className="share-name">{name}</span>
              <span className="amount">{formatMoney(share.amountCents, bill.currency)}</span>
              <span className="share-status">
                {share.paidAt ? (
                  <span className={justPaid ? 'paid-label paid-pop' : 'paid-label'}>
                    <Icon name="check" size={14} />
                    Paid
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={payingShareId !== null}
                    aria-label={`Pay ${formatMoney(share.amountCents, bill.currency)} for ${name}`}
                    onClick={() => onPay(bill.id, share.id)}
                  >
                    {paying && <span className="btn-spinner" aria-hidden="true" />}
                    {paying ? 'Paying…' : 'Pay'}
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
