import { useState } from 'react'
import type { Editor } from '@tiptap/react'

interface TableMenuProps {
  editor: Editor
  onClose: () => void
}

const MAX_COLS = 10
const MAX_ROWS = 8

export default function TableMenu({ editor, onClose }: TableMenuProps): JSX.Element {
  const [hover, setHover] = useState({ rows: 0, cols: 0 })
  const [customOpen, setCustomOpen] = useState(false)
  const [customRows, setCustomRows] = useState(3)
  const [customCols, setCustomCols] = useState(3)

  const insert = (rows: number, cols: number): void => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    onClose()
  }

  return (
    <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
      {!customOpen ? (
        <>
          <div className="mb-2 text-xs text-gray-500">
            {hover.rows > 0 ? `${hover.rows} x ${hover.cols} Table` : 'Insert Table'}
          </div>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 16px)` }}
            onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
          >
            {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, i) => {
              const r = Math.floor(i / MAX_COLS) + 1
              const c = (i % MAX_COLS) + 1
              const active = r <= hover.rows && c <= hover.cols
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHover({ rows: r, cols: c })}
                  onClick={() => insert(r, c)}
                  className={`h-4 w-4 cursor-pointer border ${
                    active ? 'border-office-word bg-office-word/20' : 'border-gray-300 bg-white'
                  }`}
                />
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="mt-3 w-full rounded border border-gray-200 px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Insert Table…
          </button>
        </>
      ) : (
        <>
          <div className="mb-2 text-sm font-medium text-gray-800">Insert Table</div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Columns</label>
              <input
                type="number"
                min={1}
                max={20}
                value={customCols}
                onChange={(e) => setCustomCols(Number(e.target.value) || 1)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Rows</label>
              <input
                type="number"
                min={1}
                max={40}
                value={customRows}
                onChange={(e) => setCustomRows(Number(e.target.value) || 1)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => insert(customRows, customCols)}
              className="rounded bg-office-word px-3 py-1 text-sm font-medium text-white hover:bg-office-word/90"
            >
              OK
            </button>
          </div>
        </>
      )}
    </div>
  )
}
