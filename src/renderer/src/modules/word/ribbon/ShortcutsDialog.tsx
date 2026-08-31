interface ShortcutsDialogProps {
  onClose: () => void
}

interface ShortcutGroup {
  label: string
  shortcuts: [string, string][]
}

// Every entry here is a real, verified binding in this app — either a
// custom shortcut Docfile wires up itself, or a default that ships with
// whichever Tiptap extensions are actually enabled (see WordEditor.tsx's
// extensions list). Nothing here is aspirational.
const GROUPS: ShortcutGroup[] = [
  {
    label: 'File',
    shortcuts: [
      ['Ctrl + S', 'Save'],
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Y / Ctrl + Shift + Z', 'Redo']
    ]
  },
  {
    label: 'Text Formatting',
    shortcuts: [
      ['Ctrl + B', 'Bold'],
      ['Ctrl + I', 'Italic'],
      ['Ctrl + U', 'Underline'],
      ['Ctrl + Shift + S', 'Strikethrough'],
      ['Ctrl + .', 'Superscript'],
      ['Ctrl + ,', 'Subscript'],
      ['Ctrl + Shift + H', 'Highlight']
    ]
  },
  {
    label: 'Paragraphs & Lists',
    shortcuts: [
      ['Ctrl + Alt + 1 – 6', 'Heading 1 – 6'],
      ['Ctrl + Shift + 8', 'Bullet list'],
      ['Ctrl + Shift + 7', 'Numbered list'],
      ['Ctrl + Shift + B', 'Blockquote'],
      ['Tab / Shift + Tab', 'Indent / outdent a list item'],
      ['Ctrl + Shift + L / E / R / J', 'Align left / center / right / justify']
    ]
  },
  {
    label: 'Editing & Navigation',
    shortcuts: [
      ['Ctrl + F', 'Find & Replace'],
      ['Ctrl + A', 'Select all'],
      ['Tab / Shift + Tab', 'Move to next / previous table cell'],
      ['Backspace / Delete', 'Delete — marks as a tracked deletion instead when Track Changes is on']
    ]
  }
]

export default function ShortcutsDialog({ onClose }: ShortcutsDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="max-h-[80vh] w-[420px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Keyboard Shortcuts</h2>
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group.label}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {group.shortcuts.map(([keys, desc]) => (
                  <tr key={keys} className="border-b border-gray-50 last:border-0">
                    <td className="py-1 pr-3 align-top">
                      <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                        {keys}
                      </kbd>
                    </td>
                    <td className="py-1 text-gray-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
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
