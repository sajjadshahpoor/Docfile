import type { Editor } from '@tiptap/react'

interface ParagraphDialogProps {
  editor: Editor
  onClose: () => void
}

function currentBlockAttrs(editor: Editor): Record<string, unknown> {
  return editor.isActive('heading') ? editor.getAttributes('heading') : editor.getAttributes('paragraph')
}

export default function ParagraphDialog({ editor, onClose }: ParagraphDialogProps): JSX.Element {
  const attrs = currentBlockAttrs(editor)
  const align = (attrs.textAlign as string) ?? 'left'
  const indentLeft = Number(attrs.indentLeft ?? 0)
  const indentRight = Number(attrs.indentRight ?? 0)
  const firstLineIndent = Number(attrs.firstLineIndent ?? 0)
  const spacingBefore = Number(attrs.spacingBefore ?? 0)
  const spacingAfter = Number(attrs.spacingAfter ?? 0)
  const lineHeight = (attrs.lineHeight as string) ?? '1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[420px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Paragraph</h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">Alignment</label>
          <select
            value={align}
            onChange={(e) => editor.chain().focus().setTextAlign(e.target.value).run()}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Centered</option>
            <option value="right">Right</option>
            <option value="justify">Justified</option>
          </select>
        </div>

        <div className="mb-1 text-xs font-medium text-gray-600">Indentation</div>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Left (in.)</label>
            <input
              type="number"
              min={0}
              max={6}
              step={0.1}
              value={indentLeft}
              onChange={(e) =>
                editor.chain().focus().setIndentLeft(parseFloat(e.target.value) || 0).run()
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Right (in.)</label>
            <input
              type="number"
              min={0}
              max={6}
              step={0.1}
              value={indentRight}
              onChange={(e) =>
                editor.chain().focus().setIndentRight(parseFloat(e.target.value) || 0).run()
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Special (in.) — negative = hanging</label>
            <input
              type="number"
              step={0.1}
              value={firstLineIndent}
              onChange={(e) =>
                editor.chain().focus().setFirstLineIndent(parseFloat(e.target.value) || 0).run()
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="mb-1 text-xs font-medium text-gray-600">Spacing</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Before (pt)</label>
            <input
              type="number"
              min={0}
              value={spacingBefore}
              onChange={(e) =>
                editor.chain().focus().setParagraphSpacing(Number(e.target.value), null).run()
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">After (pt)</label>
            <input
              type="number"
              min={0}
              value={spacingAfter}
              onChange={(e) =>
                editor.chain().focus().setParagraphSpacing(null, Number(e.target.value)).run()
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Line spacing</label>
            <select
              value={lineHeight}
              onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="1">1.0</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2">2.0</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-office-word px-4 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
