import { useState } from 'react'
import type { CustomMargins, PageSetup } from '../pageSetup'

interface MarginsDialogProps {
  pageSetup: PageSetup
  onApply: (customMargins: CustomMargins) => void
  onClose: () => void
}

export default function MarginsDialog({ pageSetup, onApply, onClose }: MarginsDialogProps): JSX.Element {
  const [margins, setMargins] = useState<CustomMargins>(pageSetup.customMargins)

  const update = (key: keyof CustomMargins, value: string): void => {
    const parsed = parseFloat(value)
    setMargins((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  const apply = (): void => {
    onApply(margins)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[360px] rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-gray-800">Custom Margins</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Top (in.)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={margins.top}
              onChange={(e) => update('top', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Bottom (in.)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={margins.bottom}
              onChange={(e) => update('bottom', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Left (in.)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={margins.left}
              onChange={(e) => update('left', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Right (in.)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={margins.right}
              onChange={(e) => update('right', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="rounded-md bg-office-word px-4 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
