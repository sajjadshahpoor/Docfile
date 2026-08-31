import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  TextBulletListLtr20Regular,
  ArrowSync20Regular,
  TextFootnote20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  ListBar20Regular,
  TextQuote20Regular,
  Book20Regular,
  DocumentBulletList20Regular,
  TextAsterisk20Regular,
  DocumentTable20Regular,
  ArrowHookUpRight20Regular
} from '@fluentui/react-icons'
import { Group, GroupDivider, ToolbarButton, BigButton } from './shared'
import FootnotesPanel from './FootnotesPanel'
import ManageSourcesDialog from './ManageSourcesDialog'
import CaptionDialog from './CaptionDialog'
import CrossReferenceDialog from './CrossReferenceDialog'
import {
  formatInTextCitation,
  formatBibliographyEntry,
  sortSourcesForBibliography,
  type CitationStyle,
  type Source
} from '../citations'
import { buildTocEntries, buildTofEntries, nextCaptionNumber, type CaptionLabel } from '../referencesUtil'

interface ReferencesTabProps {
  editor: Editor
  sources: Source[]
  onSourcesChange: (sources: Source[]) => void
  citationStyle: CitationStyle
  onCitationStyleChange: (style: CitationStyle) => void
}

export default function ReferencesTab({
  editor,
  sources,
  onSourcesChange,
  citationStyle,
  onCitationStyleChange
}: ReferencesTabProps): JSX.Element {
  const [footnotesOpen, setFootnotesOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [captionOpen, setCaptionOpen] = useState(false)
  const [crossRefOpen, setCrossRefOpen] = useState(false)

  const insertTableOfContents = (): void => {
    editor.chain().focus().insertTableOfContents(buildTocEntries(editor)).run()
  }

  const updateTableOfContents = (): void => {
    editor.chain().focus().updateTableOfContents(buildTocEntries(editor)).run()
  }

  const insertNote = (kind: 'footnote' | 'endnote'): void => {
    const text = window.prompt(`${kind === 'footnote' ? 'Footnote' : 'Endnote'} text`)
    if (!text) return
    editor.chain().focus().insertNote(kind, text).run()
  }

  const goToAdjacentNote = (direction: 'next' | 'previous'): void => {
    const notes: { from: number; to: number }[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'footnoteRef') notes.push({ from: pos, to: pos + node.nodeSize })
    })
    if (!notes.length) return
    const { to } = editor.state.selection
    const target =
      direction === 'next'
        ? notes.find((n) => n.from > to) ?? notes[0]
        : [...notes].reverse().find((n) => n.to < to) ?? notes[notes.length - 1]
    editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).scrollIntoView().run()
  }

  const insertCitation = (): void => {
    if (sources.length === 0) {
      window.alert('No sources yet — use Manage Sources to add one first.')
      setSourcesOpen(true)
      return
    }
    const list = sources.map((s, i) => `${i + 1}. ${s.title || s.author || 'Untitled'}`).join('\n')
    const choice = window.prompt(`Insert citation for which source?\n${list}\n\nEnter a number:`, '1')
    if (!choice) return
    const index = Number(choice) - 1
    const source = sources[index]
    if (!source) return
    editor.chain().focus().insertCitation(source.id, formatInTextCitation(source, citationStyle)).run()
  }

  const updateCitations = (): void => {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'citationRef') return
      const source = sources.find((s) => s.id === node.attrs.sourceId)
      if (!source) return
      const displayText = formatInTextCitation(source, citationStyle)
      if (displayText !== node.attrs.displayText) {
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, displayText })
        )
      }
    })
  }

  const insertBibliography = (): void => {
    const usedIds = new Set<string>()
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'citationRef') usedIds.add(node.attrs.sourceId)
    })
    const cited = sortSourcesForBibliography(sources.filter((s) => usedIds.has(s.id)))
    const entries = cited.length ? cited : sortSourcesForBibliography(sources)
    if (!entries.length) {
      window.alert('No sources to list — add one via Manage Sources first.')
      return
    }
    editor
      .chain()
      .focus()
      .insertContent([
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bibliography' }] },
        ...entries.map((s) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: formatBibliographyEntry(s, citationStyle) }]
        }))
      ])
      .run()
  }

  const insertTableOfFigures = (label: CaptionLabel): void => {
    editor.chain().focus().insertTableOfFigures(label, buildTofEntries(editor, label)).run()
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Table of Contents">
        <BigButton title="Insert Table of Contents" icon={TextBulletListLtr20Regular} label="Table of Contents" onClick={insertTableOfContents} />
        <ToolbarButton title="Update Table of Contents" icon={ArrowSync20Regular} onClick={updateTableOfContents}>
          Update Table
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Footnotes">
        <ToolbarButton title="Insert Footnote" icon={TextFootnote20Regular} onClick={() => insertNote('footnote')}>
          Insert Footnote
        </ToolbarButton>
        <ToolbarButton title="Insert Endnote" icon={TextFootnote20Regular} onClick={() => insertNote('endnote')}>
          Insert Endnote
        </ToolbarButton>
        <ToolbarButton title="Previous footnote/endnote" icon={ChevronLeft20Regular} onClick={() => goToAdjacentNote('previous')} />
        <ToolbarButton title="Next footnote/endnote" icon={ChevronRight20Regular} onClick={() => goToAdjacentNote('next')} />
        <ToolbarButton title="Show all footnotes/endnotes" icon={ListBar20Regular} onClick={() => setFootnotesOpen(true)}>
          Show Notes
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Citations &amp; Bibliography">
        <ToolbarButton title="Insert Citation" icon={TextQuote20Regular} onClick={insertCitation}>
          Insert Citation
        </ToolbarButton>
        <ToolbarButton title="Manage Sources" icon={Book20Regular} onClick={() => setSourcesOpen(true)}>
          Manage Sources
        </ToolbarButton>
        <select
          value={citationStyle}
          onChange={(e) => onCitationStyleChange(e.target.value as CitationStyle)}
          title="Citation style"
          className="h-7 rounded border border-gray-300 bg-white px-2 text-[13px] text-gray-800"
        >
          <option value="apa">APA</option>
          <option value="mla">MLA</option>
          <option value="chicago">Chicago</option>
        </select>
        <ToolbarButton title="Update Citations" icon={ArrowSync20Regular} onClick={updateCitations} />
        <BigButton title="Insert Bibliography" icon={DocumentBulletList20Regular} label="Bibliography" onClick={insertBibliography} />
      </Group>

      <GroupDivider />

      <Group label="Captions">
        <ToolbarButton title="Insert Caption" icon={TextAsterisk20Regular} onClick={() => setCaptionOpen(true)}>
          Insert Caption
        </ToolbarButton>
        <div className="flex items-center gap-1">
          <DocumentTable20Regular className="h-4 w-4" />
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) insertTableOfFigures(e.target.value as CaptionLabel)
              e.target.value = ''
            }}
            title="Insert Table of Figures"
            className="h-7 rounded border border-gray-300 bg-white px-1.5 text-[13px] text-gray-800"
          >
            <option value="" disabled>
              Table of Figures…
            </option>
            <option value="Figure">Table of Figures</option>
            <option value="Table">Table of Tables</option>
            <option value="Equation">Table of Equations</option>
          </select>
        </div>
        <ToolbarButton title="Cross-reference" icon={ArrowHookUpRight20Regular} onClick={() => setCrossRefOpen(true)}>
          Cross-reference
        </ToolbarButton>
      </Group>

      {footnotesOpen && (
        <FootnotesPanel
          editor={editor}
          onClose={() => {
            setFootnotesOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {sourcesOpen && (
        <ManageSourcesDialog
          sources={sources}
          onSourcesChange={onSourcesChange}
          onClose={() => {
            setSourcesOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {captionOpen && (
        <CaptionDialog
          editor={editor}
          onClose={() => {
            setCaptionOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {crossRefOpen && (
        <CrossReferenceDialog
          editor={editor}
          onClose={() => {
            setCrossRefOpen(false)
            editor.commands.focus()
          }}
        />
      )}
    </div>
  )
}
