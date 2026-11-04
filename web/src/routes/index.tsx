import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { HomePicker } from '../components/HomePicker'
import { HomeView } from '../components/HomeView'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { homeId?: string } =>
    typeof search.homeId === 'string' && search.homeId !== '' ? { homeId: search.homeId } : {},
  component: Home,
})

function Home() {
  const { homeId } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return homeId ? (
    <HomeView key={homeId} homeId={homeId} onLeave={() => void navigate({ search: {} })} />
  ) : (
    <HomePicker onSelect={(id) => void navigate({ search: { homeId: id } })} />
  )
}
