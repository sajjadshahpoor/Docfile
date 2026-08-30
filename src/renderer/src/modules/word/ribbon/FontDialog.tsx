import type { Editor } from '@tiptap/react'
import { COMMON_FONTS, ALL_OFFICE_FONTS } from '../fonts'
import type { UnderlineStyle } from '../extensions/underlineExtras'
import type { SpacingPreset } from '../extensions/characterSpacing'

interface FontDialogProps {
  editor: Editor
  onClose: () => void
}

const UNDERLINE_STYLES: { value: UnderlineStyle; label: string }[] = [
  { value: 'solid', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'wavy', label: 'Wavy' }
]

export default function FontDialog({ editor, onClose }: FontDialogProps): JSX.Element {
  const textStyle = editor.getAttributes('textStyle')
  const underline = editor.getAttributes('underline')
  const strike = editor.getAttributes('strike')

  const currentFont = (textStyle.fontFamily as string) ?? 'default'
  const currentSize = (textStyle.fontSize as string)?.replace('pt', '') ?? ''
  const currentColor = (textStyle.color as string) ?? '#000000'
  const currentUnderlineStyle = (underline.underlineStyle as UnderlineStyle) ?? 'solid'
  const currentUnderlineColor = (underline.underlineColor as string) ?? '#000000'
  const currentSpacing = (textStyle.characterSpacing as string)
    ? textStyle.characterSpacing === '-0.5px'
      ? 'condensed'
      : 'expanded'
    : 'normal'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[420px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Font</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Font</label>
            <select
              value={currentFont}
              onChange={(e) => {
                if (e.target.value === 'default') editor.chain().focus().unsetFontFamily().run()
                else editor.chain().focus().setFontFamily(e.target.value).run()
              }}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="default">Default</option>
              <optgroup label="Common">
                {COMMON_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Office fonts">
                {ALL_OFFICE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Size</label>
            <input
              type="number"
              min={1}
              value={currentSize}
              onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}pt`).run()}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Font color</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="h-8 w-full cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Character spacing</label>
            <select
              value={currentSpacing}
              onChange={(e) => editor.chain().focus().setCharacterSpacing(e.target.value as SpacingPreset).run()}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="condensed">Condensed</option>
              <option value="normal">Normal</option>
              <option value="expanded">Expanded</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Underline style</label>
            <select
              value={currentUnderlineStyle}
              onChange={(e) => {
                if (!editor.isActive('underline')) editor.chain().focus().toggleUnderline().run()
                editor
                  .chain()
                  .focus()
                  .setMark('underline', { underlineStyle: e.target.value })
                  .run()
              }}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              {UNDERLINE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Underline color</label>
            <input
              type="color"
              value={currentUnderlineColor}
              onChange={(e) => {
                if (!editor.isActive('underline')) editor.chain().focus().toggleUnderline().run()
                editor.chain().focus().setMark('underline', { underlineColor: e.target.value }).run()
              }}
              className="h-8 w-full cursor-pointer rounded border border-gray-300"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 text-xs text-gray-500">Effects</div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editor.isActive('strike')}
                onChange={() => editor.chain().focus().toggleStrike().run()}
              />
              Strikethrough
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!strike.double}
                onChange={(e) => {
                  if (!editor.isActive('strike')) editor.chain().focus().toggleStrike().run()
                  editor.chain().focus().setMark('strike', { double: e.target.checked }).run()
                }}
              />
              Double strikethrough
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editor.isActive('superscript')}
                onChange={() => editor.chain().focus().toggleSuperscript().run()}
              />
              Superscript
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editor.isActive('subscript')}
                onChange={() => editor.chain().focus().toggleSubscript().run()}
              />
              Subscript
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!textStyle.smallCaps}
                onChange={(e) => editor.chain().focus().setSmallCaps(e.target.checked).run()}
              />
              Small caps
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!textStyle.allCaps}
                onChange={(e) => editor.chain().focus().setAllCaps(e.target.checked).run()}
              />
              All caps
            </label>
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
