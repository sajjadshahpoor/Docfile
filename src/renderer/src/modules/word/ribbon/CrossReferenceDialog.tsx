import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { listCrossReferenceTargets, type CrossRefTarget } from '../referencesUtil'

interface CrossReferenceDialogProps {
  editor: Editor
  onClose: () => void
}

const KIND_LABELS: Record<CrossRefTarget['kind'], string> = {
  heading: 'Heading',
  bookmark: 'Bookmark',
  caption: 'Figure/Table/Equation'
}

export default function CrossReferenceDialog({ editor, onClose }: CrossReferenceDialogProps): JSX.Element {
  const targets = listCrossReferenceTargets(editor)
  const [kind, setKind] = useState<'all' | CrossRefTarget['kind']>('all')

  const filtered = kind === 'all' ? targets : targets.filter((t) => t.kind === kind)

  const insertReference = (target: CrossRefTarget): void => {
    editor.chain().focus().insertContent(target.label).run()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[440px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Cross-reference</h2>

        <label className="mb-1 block text-xs text-gray-500">Reference type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="all">All</option>
          <option value="heading">Heading</option>
          <option value="bookmark">Bookmark</option>
          <option value="caption">Figure/Table/Equation</option>
        </select>

        <label className="mb-1 block text-xs text-gray-500">For which item</label>
        <div className="max-h-56 overflow-y-auto rounded border border-gray-200">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">
              Nothing to reference yet — add a heading, bookmark, or caption first.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((t, i) => (
                <li key={`${t.kind}-${t.from}-${i}`}>
                  <button
                    type="button"
                    onClick={() => insertReference(t)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="truncate">{t.label}</span>
                    <span className="ml-2 flex-shrink-0 text-xs text-gray-400">{KIND_LABELS[t.kind]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
