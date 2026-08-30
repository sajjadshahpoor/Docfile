import { useState } from 'react'
import type { RecentFile } from '../../../store/appStore'

interface RecentListProps {
  recents: RecentFile[]
  onOpen: (path: string) => void
  onToggleFavorite: (path: string) => void
}

function formatBreadcrumb(path: string): string {
  const parts = path.split(/[\\/]/).slice(0, -1)
  // Drop drive letter and "Users\<name>" so the breadcrumb reads like Word's
  // (e.g. "Desktop » Docfile" instead of "C: » Users » sajja » Desktop » Docfile").
  const usersIdx = parts.findIndex((p) => p.toLowerCase() === 'users')
  const trimmed = usersIdx >= 0 ? parts.slice(usersIdx + 2) : parts.slice(1)
  return trimmed.join(' » ') || path
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function RecentList({ recents, onOpen, onToggleFavorite }: RecentListProps): JSX.Element {
  const [tab, setTab] = useState<'recent' | 'favorites' | 'shared'>('recent')
  const [query, setQuery] = useState('')

  const base =
    tab === 'favorites' ? recents.filter((r) => r.favorite) : tab === 'shared' ? [] : recents

  const filtered = query
    ? base.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : base

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('recent')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === 'recent' ? 'bg-office-word text-white' : 'border border-gray-300 text-gray-700'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === 'favorites' ? 'bg-office-word text-white' : 'border border-gray-300 text-gray-700'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setTab('shared')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === 'shared' ? 'bg-office-word text-white' : 'border border-gray-300 text-gray-700'
            }`}
          >
            Shared with Me
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a file"
          className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {tab === 'shared' ? (
        <p className="text-sm text-gray-400">
          Docfile works fully offline, so there are no shared files here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">
          {tab === 'favorites' ? 'No favorites yet — star a file to pin it here.' : 'No recent files yet.'}
        </p>
      ) : (
        <div>
          <div className="border-b border-gray-200 pb-1 text-xs font-medium text-gray-400">Name</div>
          <ul className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <li key={r.path} className="flex items-center gap-3 py-2.5">
                <button
                  onClick={() => onToggleFavorite(r.path)}
                  title={r.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  className={`text-lg ${r.favorite ? 'text-amber-400' : 'text-gray-300 hover:text-gray-400'}`}
                >
                  {r.favorite ? '★' : '☆'}
                </button>
                <button onClick={() => onOpen(r.path)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm text-gray-800">{r.name}</div>
                  <div className="truncate text-xs text-gray-400">{formatBreadcrumb(r.path)}</div>
                </button>
                <div className="w-40 shrink-0 text-right text-xs text-gray-400">
                  {formatDate(r.openedAt)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
