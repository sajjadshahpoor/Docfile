import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { ModuleName } from '../../store/appStore'
import AboutModal from '../../components/AboutModal'

const MODULE_META: Record<
  ModuleName,
  { label: string; color: string; icon: string; extension: string; enabled: boolean }
> = {
  word: { label: 'Word', color: 'bg-office-word', icon: 'W', extension: 'docx', enabled: true },
  excel: {
    label: 'Excel',
    color: 'bg-office-excel',
    icon: 'X',
    extension: 'xlsx',
    enabled: false
  },
  powerpoint: {
    label: 'PowerPoint',
    color: 'bg-office-powerpoint',
    icon: 'P',
    extension: 'pptx',
    enabled: false
  }
}

function NewTile({ moduleName }: { moduleName: ModuleName }): JSX.Element {
  const meta = MODULE_META[moduleName]
  const openModule = useAppStore((s) => s.openModule)

  return (
    <button
      disabled={!meta.enabled}
      onClick={() => openModule(moduleName, null)}
      className={`flex flex-col items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <div
        className={`flex h-16 w-14 items-center justify-center rounded-sm ${meta.color} text-2xl font-semibold text-white`}
      >
        {meta.icon}
      </div>
      <div>
        <div className="font-semibold text-gray-800">New {meta.label} Document</div>
        <div className="text-xs text-gray-500">
          {meta.enabled ? `.${meta.extension}` : 'Coming soon'}
        </div>
      </div>
    </button>
  )
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export default function Launcher(): JSX.Element {
  const recents = useAppStore((s) => s.recents)
  const openModule = useAppStore((s) => s.openModule)
  const [aboutOpen, setAboutOpen] = useState(false)

  const openExistingFile = async (moduleName: ModuleName): Promise<void> => {
    const filePath = await window.docfile.openFile(moduleName)
    if (filePath) openModule(moduleName, filePath)
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <header className="flex items-start justify-between border-b border-gray-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Docfile</h1>
          <p className="text-sm text-gray-500">
            Your local, offline document suite — files never leave this computer.
          </p>
        </div>
        <button
          onClick={() => setAboutOpen(true)}
          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          About Docfile
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            New
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NewTile moduleName="word" />
            <NewTile moduleName="excel" />
            <NewTile moduleName="powerpoint" />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Open existing file
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => openExistingFile('word')}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Open .docx…
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
            >
              Open .xlsx… (soon)
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
            >
              Open .pptx… (soon)
            </button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Recent
          </h2>
          {recents.length === 0 ? (
            <p className="text-sm text-gray-400">No recent files yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {recents.map((r) => (
                <li key={r.path}>
                  <button
                    onClick={() => openModule(r.module, r.path)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-sm text-xs font-semibold text-white ${MODULE_META[r.module].color}`}
                      >
                        {MODULE_META[r.module].icon}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{r.name}</span>
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.openedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  )
}
