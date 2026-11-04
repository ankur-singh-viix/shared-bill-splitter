import { useRef, useState } from 'react'
import { api, type Balance, describeError, type HomeDetails } from '../api'
import { summarize } from '../summary'
import { useHome } from '../useHome'
import { BalancesSection } from './balances/BalancesSection'
import { BillForm } from './bills/BillForm'
import { BillList } from './bills/BillList'
import { Header } from './dashboard/Header'
import { SettingsSection } from './dashboard/SettingsSection'
import { type Section, Sidebar } from './dashboard/Sidebar'
import { SummaryCards } from './dashboard/SummaryCards'
import { Modal } from './Modal'
import { AddMemberForm } from './members/AddMemberForm'
import { MemberList } from './members/MemberList'
import { Notice } from './Notice'
import { ToastRegion, useToasts } from './Toasts'

type Dialog = 'member' | 'bill' | null

type ContentProps = {
  home: HomeDetails
  balances: Balance[]
  refresh: () => Promise<void>
  section: Section
  refreshError: string | null
}

function Content({ home, balances, refresh, section, refreshError }: ContentProps) {
  const [dialog, setDialog] = useState<Dialog>(null)
  const [payingShareId, setPayingShareId] = useState<string | null>(null)
  const [paidShareId, setPaidShareId] = useState<string | null>(null)
  const { toasts, push, dismiss } = useToasts()
  // A retry after a failed payment reuses its key, so the server can never pay a share twice.
  const keys = useRef(new Map<string, string>())

  async function pay(billId: string, shareId: string) {
    const key = keys.current.get(shareId) ?? crypto.randomUUID()
    keys.current.set(shareId, key)
    setPayingShareId(shareId)
    try {
      await api.payShare(billId, shareId, key)
      keys.current.delete(shareId)
      push('success', 'Payment recorded.')
      await refresh()
      setPaidShareId(shareId)
      setTimeout(() => setPaidShareId((current) => (current === shareId ? null : current)), 1800)
    } catch (err) {
      push('error', `Payment failed: ${describeError(err)}`)
    } finally {
      setPayingShareId(null)
    }
  }

  const openBillForm = () => setDialog('bill')
  const billList = (limit?: number, title?: string) => (
    <BillList
      bills={home.bills}
      members={home.members}
      payingShareId={payingShareId}
      paidShareId={paidShareId}
      onPay={pay}
      onCreate={openBillForm}
      limit={limit}
      title={title}
    />
  )

  return (
    <>
      {refreshError && (
        <Notice kind="error">
          Could not refresh, showing the last loaded data. {refreshError}
        </Notice>
      )}
      {section === 'overview' && (
        <div className="stack">
          <SummaryCards summary={summarize(home.bills)} />
          <BalancesSection balances={balances} />
          {billList(3, 'Recent bills')}
        </div>
      )}
      {section === 'bills' && billList()}
      {section === 'members' && (
        <MemberList members={home.members} balances={balances} onAdd={() => setDialog('member')} />
      )}
      {section === 'balances' && <BalancesSection balances={balances} />}
      {section === 'settings' && <SettingsSection />}

      <Modal title="Add member" open={dialog === 'member'} onClose={() => setDialog(null)}>
        <AddMemberForm
          onSubmit={async (name) => {
            await api.addMember(home.id, name)
            push('success', `${name} added to ${home.name}.`)
            await refresh()
          }}
          onDone={() => setDialog(null)}
        />
      </Modal>
      <Modal title="New bill" open={dialog === 'bill'} onClose={() => setDialog(null)}>
        {home.members.length === 0 ? (
          <Notice kind="info">Add at least one member before splitting a bill.</Notice>
        ) : (
          <BillForm
            onSubmit={async (title, totalCents, currency) => {
              await api.createBill(home.id, title, totalCents, currency)
              push('success', `${title} split between ${home.members.length} members.`)
              await refresh()
            }}
            onDone={() => setDialog(null)}
          />
        )}
      </Modal>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </>
  )
}

export function HomeView({ homeId, onLeave }: { homeId: string; onLeave: () => void }) {
  const { state, refreshError, reload, refresh } = useHome(homeId)
  const [section, setSection] = useState<Section>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="center-screen" role="status">
        <div className="spinner" aria-hidden="true" />
        <p className="muted">Loading home…</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="center-screen">
        <div className="card stack error-card">
          <h2>Could not load this home</h2>
          <Notice kind="error">{state.message}</Notice>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onLeave}>
              Choose another home
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void reload()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <Sidebar
        section={section}
        open={menuOpen}
        onSelect={(next) => {
          setSection(next)
          setMenuOpen(false)
        }}
        onClose={() => setMenuOpen(false)}
      />
      <div className="main">
        <Header
          homeId={state.home.id}
          homeName={state.home.name}
          onOpenMenu={() => setMenuOpen(true)}
          onSwitchHome={onLeave}
        />
        <main className="content">
          <Content
            home={state.home}
            balances={state.balances}
            refresh={refresh}
            section={section}
            refreshError={refreshError}
          />
        </main>
      </div>
    </div>
  )
}
