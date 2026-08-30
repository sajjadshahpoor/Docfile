import { useEffect, useState } from 'react'

type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export default function UpdateBanner(): JSX.Element | null {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.docfile?.onUpdateStatus) return
    const unsubscribe = window.docfile.onUpdateStatus((next) => {
      setStatus(next)
      setDismissed(false)
    })
    return unsubscribe
  }, [])

  if (!status || dismissed) return null
  if (status.state === 'checking' || status.state === 'not-available') return null
  // Background check failures (e.g. offline) shouldn't interrupt the user.
  if (status.state === 'error') return null

  const restart = (): void => {
    window.docfile.restartAndInstallUpdate()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-lg">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        title="Dismiss"
      >
        ✕
      </button>

      {status.state === 'available' && (
        <div>
          <div className="font-medium text-gray-800">Update available</div>
          <div className="mt-1 text-gray-500">
            Docfile v{status.version} is downloading in the background…
          </div>
        </div>
      )}

      {status.state === 'downloading' && (
        <div>
          <div className="font-medium text-gray-800">Downloading update…</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-office-word transition-all"
              style={{ width: `${status.percent}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-400">{status.percent}%</div>
        </div>
      )}

      {status.state === 'downloaded' && (
        <div>
          <div className="font-medium text-gray-800">Update ready — v{status.version}</div>
          <div className="mt-1 text-gray-500">Restart Docfile to finish installing it.</div>
          <button
            onClick={restart}
            className="mt-3 w-full rounded-md bg-office-word px-3 py-1.5 text-sm font-medium text-white hover:bg-office-word/90"
          >
            Restart & Update
          </button>
        </div>
      )}
    </div>
  )
}
