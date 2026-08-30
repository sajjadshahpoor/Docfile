interface SharePanelProps {
  currentPath: string | null
  onGoToExport: () => void
}

export default function SharePanel({ currentPath, onGoToExport }: SharePanelProps): JSX.Element {
  const showInFolder = (): void => {
    if (currentPath) window.docfile.showItemInFolder(currentPath)
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-800">Share</h1>
      <p className="mb-6 max-w-md text-sm text-gray-500">
        Docfile works fully offline, so there's no cloud sharing. Export a copy as PDF to send
        to someone, or reveal the saved file to attach it manually.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onGoToExport}
          className="rounded-md bg-office-word px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-office-word/90"
        >
          Export as PDF
        </button>
        <button
          onClick={showInFolder}
          disabled={!currentPath}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Show in Folder
        </button>
      </div>
      {!currentPath && (
        <p className="mt-3 text-xs text-gray-400">Save the document first to show it in a folder.</p>
      )}
    </div>
  )
}
