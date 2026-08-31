import type { Editor } from '@tiptap/react'

interface StatusBarProps {
  editor: Editor | null
  zoom: number
  onZoomChange: (zoom: number) => void
  showWordCount?: boolean
  currentPage?: number
  pageCount?: number
}

export default function StatusBar({
  editor,
  zoom,
  onZoomChange,
  showWordCount = true,
  currentPage,
  pageCount
}: StatusBarProps): JSX.Element {
  const words = editor?.storage.characterCount?.words() ?? 0
  const characters = editor?.storage.characterCount?.characters() ?? 0

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-1 text-xs text-gray-500">
      <div className="flex items-center gap-3">
        {pageCount !== undefined && (
          <span>
            Page {currentPage ?? pageCount} of {pageCount}
          </span>
        )}
        <span>
          {showWordCount
            ? `${words} word${words === 1 ? '' : 's'} · ${characters} character${characters === 1 ? '' : 's'}`
            : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          className="rounded px-1.5 hover:bg-gray-200"
        >
          −
        </button>
        <input
          type="range"
          min={50}
          max={200}
          step={10}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-28"
        />
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          className="rounded px-1.5 hover:bg-gray-200"
        >
          +
        </button>
        <span className="w-10 text-right">{zoom}%</span>
      </div>
    </div>
  )
}
