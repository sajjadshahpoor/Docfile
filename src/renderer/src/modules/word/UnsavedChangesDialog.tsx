interface UnsavedChangesDialogProps {
  fileName: string
  onSave: () => void
  onDontSave: () => void
  onCancel: () => void
}

export default function UnsavedChangesDialog({
  fileName,
  onSave,
  onDontSave,
  onCancel
}: UnsavedChangesDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="w-96 rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-base font-semibold text-gray-800">Do you want to save changes to {fileName}?</div>
        <p className="mt-2 text-sm text-gray-500">Your changes will be lost if you don't save them.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onDontSave}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Don't Save
          </button>
          <button
            onClick={onSave}
            className="rounded-md bg-office-word px-3 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
