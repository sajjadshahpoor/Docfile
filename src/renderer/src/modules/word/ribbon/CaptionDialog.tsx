import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { nextCaptionNumber, type CaptionLabel } from '../referencesUtil'

interface CaptionDialogProps {
  editor: Editor
  onClose: () => void
}

const LABELS: CaptionLabel[] = ['Figure', 'Table', 'Equation']

export default function CaptionDialog({ editor, onClose }: CaptionDialogProps): JSX.Element {
  const [label, setLabel] = useState<CaptionLabel>('Figure')
  const [description, setDescription] = useState('')

  const number = nextCaptionNumber(editor, label)

  const insert = (): void => {
    const text = `${label} ${number}${description ? `: ${description}` : ''}`
    editor
      .chain()
      .focus()
      .insertContent({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] })
      .run()
    // The paragraph we just inserted is the one the cursor now sits in —
    // flag it as a caption so listCaptions()/Table of Figures can find it.
    editor.chain().focus().setCaptionLabel(label).run()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[380px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Insert Caption</h2>

        <label className="mb-1 block text-xs text-gray-500">Label</label>
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value as CaptionLabel)}
          className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          {LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-xs text-gray-500">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Quarterly revenue by region"
          className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />

        <div className="mb-4 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-600">
          {label} {number}
          {description ? `: ${description}` : ''}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={insert}
            className="rounded-md bg-office-word px-4 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
