import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  TextWordCount20Regular,
  Speaker220Regular,
  Play20Regular,
  Stop20Regular,
  CommentAdd20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Comment20Regular,
  DocumentEdit20Regular,
  Checkmark20Regular,
  Dismiss20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular
} from '@fluentui/react-icons'
import { Group, GroupDivider, ToolbarButton, BigButton } from './shared'
import CommentsPanel from './CommentsPanel'
import WordCountDialog from './WordCountDialog'
import { listComments, goToRange } from '../docMarks'
import { changeAtOrAfter, acceptChange, rejectChange, goToNextChange, goToPreviousChange } from '../reviewActions'
import type { MarkupView } from '../extensions/trackChanges'

interface ReviewTabProps {
  editor: Editor
  pageContentHeightPx: number
  trackChangesEnabled: boolean
  onTrackChangesEnabledChange: (enabled: boolean) => void
  markupView: MarkupView
  onMarkupViewChange: (mode: MarkupView) => void
}

export default function ReviewTab({
  editor,
  pageContentHeightPx,
  trackChangesEnabled,
  onTrackChangesEnabledChange,
  markupView,
  onMarkupViewChange
}: ReviewTabProps): JSX.Element {
  const [wordCountOpen, setWordCountOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const toggleTrackChanges = (): void => {
    const next = !trackChangesEnabled
    editor.chain().focus().setTrackChangesEnabled(next).run()
    onTrackChangesEnabledChange(next)
  }

  const setMarkup = (mode: MarkupView): void => {
    editor.chain().focus().setMarkupView(mode).run()
    onMarkupViewChange(mode)
  }

  const addComment = (): void => {
    if (editor.state.selection.empty) {
      window.alert('Select some text first to comment on it.')
      return
    }
    const text = window.prompt('Comment')
    if (!text) return
    const commentId = `c${Date.now()}${Math.floor(Math.random() * 1000)}`
    editor
      .chain()
      .focus()
      .setMark('comment', { commentId, author: 'Docfile User', text, date: new Date().toISOString() })
      .run()
  }

  const goToComment = (direction: 'next' | 'previous'): void => {
    const comments = listComments(editor)
    if (!comments.length) return
    const { from, to } = editor.state.selection
    const target =
      direction === 'next'
        ? comments.find((c) => c.from > to) ?? comments[0]
        : [...comments].reverse().find((c) => c.to < from) ?? comments[comments.length - 1]
    goToRange(editor, target.from, target.to)
  }

  const readAloud = (): void => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (synth.speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const { from, to, empty } = editor.state.selection
    const text = empty ? editor.state.doc.textContent : editor.state.doc.textBetween(from, to, ' ')
    if (!text.trim()) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synth.speak(utterance)
    setSpeaking(true)
  }

  const acceptCurrent = (): void => {
    const entry = changeAtOrAfter(editor, editor.state.selection.to)
    if (entry) acceptChange(editor, entry)
  }

  const rejectCurrent = (): void => {
    const entry = changeAtOrAfter(editor, editor.state.selection.to)
    if (entry) rejectChange(editor, entry)
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Proofing">
        <BigButton title="Word Count" icon={TextWordCount20Regular} label="Word Count" onClick={() => setWordCountOpen(true)} />
      </Group>

      <GroupDivider />

      <Group label="Speech">
        <BigButton
          title={speaking ? 'Stop reading' : 'Read Aloud (selection, or whole document)'}
          icon={speaking ? Stop20Regular : Play20Regular}
          label={speaking ? 'Stop' : 'Read Aloud'}
          active={speaking}
          onClick={readAloud}
        />
      </Group>

      <GroupDivider />

      <Group label="Comments">
        <BigButton title="New comment" icon={CommentAdd20Regular} label="New Comment" onClick={addComment} />
        <ToolbarButton title="Previous comment" icon={ChevronLeft20Regular} onClick={() => goToComment('previous')} />
        <ToolbarButton title="Next comment" icon={ChevronRight20Regular} onClick={() => goToComment('next')} />
        <ToolbarButton title="Show all comments" icon={Comment20Regular} onClick={() => setCommentsOpen(true)}>
          Comments…
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Tracking">
        <BigButton
          title="Track Changes"
          icon={DocumentEdit20Regular}
          label="Track Changes"
          active={trackChangesEnabled}
          onClick={toggleTrackChanges}
        />
        <select
          value={markupView}
          onChange={(e) => setMarkup(e.target.value as MarkupView)}
          title="Display for review"
          className="h-7 rounded border border-gray-300 bg-white px-2 text-[13px] text-gray-800"
        >
          <option value="all">All Markup</option>
          <option value="final">No Markup</option>
          <option value="original">Original</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Changes">
        <BigButton title="Accept this change" icon={CheckmarkCircle20Regular} label="Accept" onClick={acceptCurrent} />
        <BigButton title="Reject this change" icon={DismissCircle20Regular} label="Reject" onClick={rejectCurrent} />
        <ToolbarButton title="Previous change" icon={ChevronLeft20Regular} onClick={() => goToPreviousChange(editor)} />
        <ToolbarButton title="Next change" icon={ChevronRight20Regular} onClick={() => goToNextChange(editor)} />
        <ToolbarButton title="Accept all changes" icon={Checkmark20Regular} onClick={() => editor.chain().focus().acceptAllChanges().run()}>
          Accept All
        </ToolbarButton>
        <ToolbarButton title="Reject all changes" icon={Dismiss20Regular} onClick={() => editor.chain().focus().rejectAllChanges().run()}>
          Reject All
        </ToolbarButton>
      </Group>

      {wordCountOpen && (
        <WordCountDialog
          editor={editor}
          pageContentHeightPx={pageContentHeightPx}
          onClose={() => {
            setWordCountOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {commentsOpen && (
        <CommentsPanel
          editor={editor}
          onClose={() => {
            setCommentsOpen(false)
            editor.commands.focus()
          }}
        />
      )}
    </div>
  )
}
