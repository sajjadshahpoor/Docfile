import type { RecentFile } from '../../../store/appStore'
import type { DocTemplate } from '../templates'
import NewGallery from './NewGallery'
import RecentList from './RecentList'

interface HomePanelProps {
  recents: RecentFile[]
  onPickTemplate: (template: DocTemplate) => void
  onOpenRecent: (path: string) => void
  onToggleFavorite: (path: string) => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePanel({
  recents,
  onPickTemplate,
  onOpenRecent,
  onToggleFavorite
}: HomePanelProps): JSX.Element {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">{greeting()}</h1>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">New</h2>
      <NewGallery onPick={onPickTemplate} />

      <div className="mt-8">
        <RecentList recents={recents} onOpen={onOpenRecent} onToggleFavorite={onToggleFavorite} />
      </div>
    </div>
  )
}
