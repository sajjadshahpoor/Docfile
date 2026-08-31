import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import HomeTab from './ribbon/HomeTab'
import InsertTab from './ribbon/InsertTab'
import DesignTab from './ribbon/DesignTab'
import LayoutTab from './ribbon/LayoutTab'
import ReferencesTab from './ribbon/ReferencesTab'
import ReviewTab from './ribbon/ReviewTab'
import ViewTab from './ribbon/ViewTab'
import HelpTab from './ribbon/HelpTab'
import type { PageSetup } from './pageSetup'
import type { HeaderFooterState } from './headerFooter'
import type { DesignSettings } from './design'
import type { MarkupView } from './extensions/trackChanges'
import type { ViewSettings } from './viewSettings'
import type { CitationStyle, Source } from './citations'

type RibbonTabName = 'home' | 'insert' | 'design' | 'layout' | 'references' | 'review' | 'view' | 'help'

const TABS: { id: RibbonTabName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'design', label: 'Design' },
  { id: 'layout', label: 'Layout' },
  { id: 'references', label: 'References' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
  { id: 'help', label: 'Help' }
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
  sources: Source[]
  onSourcesChange: (sources: Source[]) => void
  citationStyle: CitationStyle
  onCitationStyleChange: (style: CitationStyle) => void
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
  sources,
  onSourcesChange,
  citationStyle,
  onCitationStyleChange,
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
      <div className="flex items-end gap-0.5 px-2 pt-1.5 text-[13px]">
        <button
          type="button"
          onClick={onOpenFileMenu}
          className="mb-[1px] rounded-t-sm bg-office-word px-3 py-1 font-medium text-white hover:bg-office-word/90"
        >
          File
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-sm border-b-2 px-2.5 py-1 font-medium transition ${
              activeTab === tab.id
                ? 'border-office-word text-office-word'
                : 'border-transparent text-[#242424] hover:bg-[#f5f5f5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 px-2 py-1">
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
        {activeTab === 'references' && (
          <ReferencesTab
            editor={editor}
            sources={sources}
            onSourcesChange={onSourcesChange}
            citationStyle={citationStyle}
            onCitationStyleChange={onCitationStyleChange}
          />
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
        {activeTab === 'help' && <HelpTab editor={editor} />}
      </div>
    </div>
  )
}
