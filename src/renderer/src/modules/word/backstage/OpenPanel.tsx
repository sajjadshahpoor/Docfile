import type { RecentFile } from '../../../store/appStore'
import RecentList from './RecentList'

interface OpenPanelProps {
  recents: RecentFile[]
  onBrowse: () => void
  onOpenRecent: (path: string) => void
  onToggleFavorite: (path: string) => void
}

export default function OpenPanel({
  recents,
  onBrowse,
  onOpenRecent,
  onToggleFavorite
}: OpenPanelProps): JSX.Element {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Open</h1>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">This PC</h2>
      <button
        onClick={onBrowse}
        className="mb-8 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Browse…
      </button>

      <RecentList recents={recents} onOpen={onOpenRecent} onToggleFavorite={onToggleFavorite} />
    </div>
  )
}
