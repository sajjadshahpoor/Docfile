import { useEffect, useState } from 'react'

interface AboutModalProps {
  onClose: () => void
}

export default function AboutModal({ onClose }: AboutModalProps): JSX.Element {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    window.docfile.getAppVersion().then(setVersion)
  }, [])

  const openDeveloperSite = (): void => {
    window.docfile.openExternal('https://sajjadshahpoor.github.io/developer/')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-office-word text-xl font-bold text-white">
          D
        </div>
        <div className="text-lg font-semibold text-gray-800">Docfile</div>
        <div className="mt-0.5 text-xs text-gray-400">Version {version || '…'}</div>
        <p className="mt-3 text-sm text-gray-500">
          A local, offline document suite. Your files never leave this computer.
        </p>

        <div className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500">
          Designed and Developed by{' '}
          <button
            onClick={openDeveloperSite}
            className="font-medium text-office-word hover:underline"
          >
            Sajjad
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}
