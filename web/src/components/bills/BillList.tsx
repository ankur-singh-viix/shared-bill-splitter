import type { Bill, Member } from '../../api'
import { Icon } from '../Icon'
import { BillCard } from './BillCard'

type Props = {
  bills: Bill[]
  members: Member[]
  payingShareId: string | null
  paidShareId: string | null
  onPay: (billId: string, shareId: string) => void
  onCreate: () => void
  limit?: number
  title?: string
}

export function BillList({
  bills,
  members,
  payingShareId,
  paidShareId,
  onPay,
  onCreate,
  limit,
  title,
}: Props) {
  const shown = limit === undefined ? bills : bills.slice(0, limit)

  return (
    <section aria-labelledby="bills-title">
      <div className="section-head">
        <h2 id="bills-title">{title ?? 'Bills'}</h2>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <Icon name="plus" size={16} />
          New bill
        </button>
      </div>
      {shown.length === 0 ? (
        <div className="empty-state card">
          <Icon name="bills" size={28} />
          <h3>No bills yet</h3>
          <p className="muted">
            {members.length === 0
              ? 'Add at least one member, then split your first bill.'
              : 'Create a bill and it is split equally between the members.'}
          </p>
        </div>
      ) : (
        <div className="bill-grid">
          {shown.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              members={members}
              payingShareId={payingShareId}
              paidShareId={paidShareId}
              onPay={onPay}
            />
          ))}
        </div>
      )}
    </section>
  )
}
