import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { RecentFile } from '../../../store/appStore'
import type { PageSetup } from '../pageSetup'
import type { DocTemplate } from '../templates'
import type { AppSettings } from '../settings'
import HomePanel from './HomePanel'
import NewPanel from './NewPanel'
import OpenPanel from './OpenPanel'
import InfoPanel from './InfoPanel'
import SaveAsPanel from './SaveAsPanel'
import PrintPanel from './PrintPanel'
import SharePanel from './SharePanel'
import ExportPanel from './ExportPanel'
import OptionsPanel from './OptionsPanel'

type BackstageTab =
  | 'home'
  | 'new'
  | 'open'
  | 'info'
  | 'save-as'
  | 'print'
  | 'share'
  | 'export'
  | 'options'

interface BackstageProps {
  editor: Editor | null
  recents: RecentFile[]
  currentPath: string | null
  fileName: string
  pageSetup: PageSetup
  onDismiss: () => void
  onCloseDocument: () => void
  onSave: () => void
  onSaveAsBrowse: () => void
  onPickTemplate: (template: DocTemplate) => void
  onOpenRecent: (path: string) => void
  onBrowseOpen: () => void
  onToggleFavorite: (path: string) => void
  onSettingsChange: (settings: AppSettings) => void
}

const NAV_ITEMS: { id: BackstageTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'new', label: 'New' },
  { id: 'open', label: 'Open' },
  { id: 'info', label: 'Info' }
]

export default function Backstage({
  editor,
  recents,
  currentPath,
  fileName,
  pageSetup,
  onDismiss,
  onCloseDocument,
  onSave,
  onSaveAsBrowse,
  onPickTemplate,
  onOpenRecent,
  onBrowseOpen,
  onToggleFavorite,
  onSettingsChange
}: BackstageProps): JSX.Element {
  const [tab, setTab] = useState<BackstageTab>('home')

  const navButtonClass = (id: BackstageTab): string =>
    `w-full rounded px-4 py-2 text-left text-sm ${
      tab === id ? 'bg-white font-semibold text-office-word' : 'text-gray-100 hover:bg-white/10'
    }`

  const actionButtonClass = 'w-full rounded px-4 py-2 text-left text-sm text-gray-100 hover:bg-white/10'

  return (
    <div className="fixed inset-0 z-40 flex bg-white">
      <div className="flex w-64 shrink-0 flex-col bg-office-word py-4">
        <button
          onClick={onDismiss}
          className="mb-4 flex items-center gap-2 px-4 text-sm text-white hover:opacity-80"
          title="Back to document"
        >
          ← <span>{fileName}</span>
        </button>

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={navButtonClass(item.id)}>
              {item.label}
            </button>
          ))}

          <div className="my-1 h-px bg-white/20" />

          <button
            onClick={() => {
              onSave()
              onDismiss()
            }}
            className={actionButtonClass}
          >
            Save
          </button>
          <button onClick={() => setTab('save-as')} className={navButtonClass('save-as')}>
            Save As
          </button>
          <button onClick={() => setTab('print')} className={navButtonClass('print')}>
            Print
          </button>
          <button onClick={() => setTab('share')} className={navButtonClass('share')}>
            Share
          </button>
          <button onClick={() => setTab('export')} className={navButtonClass('export')}>
            Export
          </button>
          <button onClick={onCloseDocument} className={actionButtonClass}>
            Close
          </button>
        </nav>

        <div className="px-2">
          <div className="my-1 h-px bg-white/20" />
          <button onClick={() => setTab('options')} className={navButtonClass('options')}>
            Options
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-10">
        {tab === 'home' && (
          <HomePanel
            recents={recents}
            onPickTemplate={onPickTemplate}
            onOpenRecent={onOpenRecent}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        {tab === 'new' && <NewPanel onPickTemplate={onPickTemplate} />}
        {tab === 'open' && (
          <OpenPanel
            recents={recents}
            onBrowse={onBrowseOpen}
            onOpenRecent={onOpenRecent}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        {tab === 'info' && <InfoPanel editor={editor} currentPath={currentPath} pageSetup={pageSetup} />}
        {tab === 'save-as' && (
          <SaveAsPanel
            onBrowse={() => {
              onSaveAsBrowse()
              onDismiss()
            }}
          />
        )}
        {tab === 'print' && <PrintPanel editor={editor} pageSetup={pageSetup} />}
        {tab === 'share' && <SharePanel currentPath={currentPath} onGoToExport={() => setTab('export')} />}
        {tab === 'export' && <ExportPanel editor={editor} pageSetup={pageSetup} defaultName={fileName} />}
        {tab === 'options' && <OptionsPanel onSettingsChange={onSettingsChange} />}
      </div>
    </div>
  )
}
