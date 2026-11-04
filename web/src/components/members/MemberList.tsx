import { type Balance, CURRENCIES, type Member } from '../../api'
import { formatMoney, initials } from '../../format'
import { Icon } from '../Icon'

type Props = { members: Member[]; balances: Balance[]; onAdd: () => void }

export function MemberList({ members, balances, onAdd }: Props) {
  const byMember = new Map(balances.map((balance) => [balance.memberId, balance]))

  return (
    <section aria-labelledby="members-title">
      <div className="section-head">
        <h2 id="members-title">Members</h2>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <Icon name="plus" size={16} />
          Add member
        </button>
      </div>
      {members.length === 0 ? (
        <div className="empty-state card">
          <Icon name="members" size={28} />
          <h3>No members yet</h3>
          <p className="muted">Add the people who share this home. Bills are split between them.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="row row-head" aria-hidden="true">
            <span className="cell-name">Member</span>
            {CURRENCIES.map((currency) => (
              <span key={currency} className="cell-money">
                {currency} owed
              </span>
            ))}
            <span className="cell-status">Status</span>
          </div>
          <ul>
            {members.map((member) => {
              const outstanding = byMember.get(member.id)?.outstandingByCurrency
              const settled = !outstanding || CURRENCIES.every((c) => outstanding[c] === 0)
              return (
                <li key={member.id} className="row">
                  <span className="cell-name">
                    <span className="avatar avatar-sm">{initials(member.name)}</span>
                    <span className="truncate" title={member.name}>
                      {member.name}
                    </span>
                  </span>
                  {CURRENCIES.map((currency) => (
                    <span key={currency} className="cell-money">
                      <span className="cell-caption">{currency}</span>
                      <span className="amount">
                        {formatMoney(outstanding?.[currency] ?? 0, currency)}
                      </span>
                    </span>
                  ))}
                  <span className="cell-status">
                    <span className={settled ? 'badge badge-ok' : 'badge badge-warn'}>
                      {settled ? 'Settled' : 'Owes'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
