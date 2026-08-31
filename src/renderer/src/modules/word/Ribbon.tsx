import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import HomeTab from './ribbon/HomeTab'
import InsertTab from './ribbon/InsertTab'
import DesignTab from './ribbon/DesignTab'
import LayoutTab from './ribbon/LayoutTab'
import ReviewTab from './ribbon/ReviewTab'
import ViewTab from './ribbon/ViewTab'
import type { PageSetup } from './pageSetup'
import type { HeaderFooterState } from './headerFooter'
import type { DesignSettings } from './design'
import type { MarkupView } from './extensions/trackChanges'
import type { ViewSettings } from './viewSettings'

type RibbonTabName = 'home' | 'insert' | 'design' | 'layout' | 'review' | 'view'

const TABS: { id: RibbonTabName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'design', label: 'Design' },
  { id: 'layout', label: 'Layout' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' }
]

interface RibbonProps {
  editor: Editor | null
  pageSetup: PageSetup
  onPageSetupChange: (setup: PageSetup) => void
  headerFooter: HeaderFooterState
  onHeaderFooterChange: (state: HeaderFooterState) => void
  design: DesignSettings
  onDesignChange: (design: DesignSettings) => void
  pageContentHeightPx: number
  trackChangesEnabled: boolean
  onTrackChangesEnabledChange: (enabled: boolean) => void
  markupView: MarkupView
  onMarkupViewChange: (mode: MarkupView) => void
  view: ViewSettings
  onViewChange: (next: ViewSettings) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFitPageWidth: () => void
  onToggleFindReplace: () => void
  onOpenFileMenu: () => void
  showFormattingMarks: boolean
  onToggleFormattingMarks: () => void
}

export default function Ribbon({
  editor,
  pageSetup,
  onPageSetupChange,
  headerFooter,
  onHeaderFooterChange,
  design,
  onDesignChange,
  pageContentHeightPx,
  trackChangesEnabled,
  onTrackChangesEnabledChange,
  markupView,
  onMarkupViewChange,
  view,
  onViewChange,
  zoom,
  onZoomChange,
  onFitPageWidth,
  onToggleFindReplace,
  onOpenFileMenu,
  showFormattingMarks,
  onToggleFormattingMarks
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
        {activeTab === 'home' && (
          <HomeTab
            editor={editor}
            onToggleFindReplace={onToggleFindReplace}
            showFormattingMarks={showFormattingMarks}
            onToggleFormattingMarks={onToggleFormattingMarks}
          />
        )}
        {activeTab === 'insert' && (
          <InsertTab
            editor={editor}
            headerFooter={headerFooter}
            onHeaderFooterChange={onHeaderFooterChange}
          />
        )}
        {activeTab === 'design' && (
          <DesignTab editor={editor} design={design} onDesignChange={onDesignChange} />
        )}
        {activeTab === 'layout' && (
          <LayoutTab editor={editor} pageSetup={pageSetup} onPageSetupChange={onPageSetupChange} />
        )}
        {activeTab === 'review' && (
          <ReviewTab
            editor={editor}
            pageContentHeightPx={pageContentHeightPx}
            trackChangesEnabled={trackChangesEnabled}
            onTrackChangesEnabledChange={onTrackChangesEnabledChange}
            markupView={markupView}
            onMarkupViewChange={onMarkupViewChange}
          />
        )}
        {activeTab === 'view' && (
          <ViewTab
            view={view}
            onViewChange={onViewChange}
            zoom={zoom}
            onZoomChange={onZoomChange}
            onFitPageWidth={onFitPageWidth}
          />
        )}
      </div>
    </div>
  )
}
