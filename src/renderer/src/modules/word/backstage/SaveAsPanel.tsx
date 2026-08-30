interface SaveAsPanelProps {
  onBrowse: () => void
}

export default function SaveAsPanel({ onBrowse }: SaveAsPanelProps): JSX.Element {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Save As</h1>
      <h2 className="mb-3 text-sm font-semibold text-gray-700">This PC</h2>
      <button
        onClick={onBrowse}
        className="rounded-md bg-office-word px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-office-word/90"
      >
        Browse…
      </button>
      <p className="mt-3 max-w-md text-xs text-gray-400">
        Choose where to save this document as a .docx file on your computer.
      </p>
    </div>
  )
}
