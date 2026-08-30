import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import HomeTab from './ribbon/HomeTab'
import InsertTab from './ribbon/InsertTab'
import LayoutTab from './ribbon/LayoutTab'
import ViewTab from './ribbon/ViewTab'
import type { PageSetup } from './pageSetup'
import type { HeaderFooterState } from './headerFooter'

type RibbonTabName = 'home' | 'insert' | 'layout' | 'view'

const TABS: { id: RibbonTabName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'layout', label: 'Layout' },
  { id: 'view', label: 'View' }
]

interface RibbonProps {
  editor: Editor | null
  pageSetup: PageSetup
  onPageSetupChange: (setup: PageSetup) => void
  headerFooter: HeaderFooterState
  onHeaderFooterChange: (state: HeaderFooterState) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onToggleFindReplace: () => void
  onOpenFileMenu: () => void
}

export default function Ribbon({
  editor,
  pageSetup,
  onPageSetupChange,
  headerFooter,
  onHeaderFooterChange,
  zoom,
  onZoomChange,
  onToggleFindReplace,
  onOpenFileMenu
}: RibbonProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<RibbonTabName>('home')

  if (!editor) return <div className="h-24 border-b border-gray-200 bg-white" />

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex gap-1 px-3 pt-1.5 text-sm">
        <button
          type="button"
          onClick={onOpenFileMenu}
          className="rounded-t bg-office-word px-3 py-1.5 font-medium text-white hover:bg-office-word/90"
        >
          File
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t px-3 py-1.5 font-medium transition ${
              activeTab === tab.id
                ? 'border border-b-0 border-gray-200 bg-white text-office-word'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 px-3 py-1.5">
        {activeTab === 'home' && <HomeTab editor={editor} onToggleFindReplace={onToggleFindReplace} />}
        {activeTab === 'insert' && (
          <InsertTab
            editor={editor}
            headerFooter={headerFooter}
            onHeaderFooterChange={onHeaderFooterChange}
          />
        )}
        {activeTab === 'layout' && (
          <LayoutTab editor={editor} pageSetup={pageSetup} onPageSetupChange={onPageSetupChange} />
        )}
        {activeTab === 'view' && <ViewTab zoom={zoom} onZoomChange={onZoomChange} />}
      </div>
    </div>
  )
}
