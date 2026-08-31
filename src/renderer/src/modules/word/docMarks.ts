import type { Editor } from '@tiptap/react'

export interface BookmarkEntry {
  name: string
  from: number
  to: number
}

export interface CommentEntry {
  commentId: string
  author: string
  text: string
  from: number
  to: number
}

// Bookmarks/comments live as marks scattered across the doc, not a single
// source of truth — these walk the document to build the list Word's own
// Bookmark and Comments panes show, merging adjacent runs of the same mark
// into one logical entry.
export function listBookmarks(editor: Editor): BookmarkEntry[] {
  const entries: BookmarkEntry[] = []
  let open: BookmarkEntry | null = null

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return
    const mark = node.marks.find((m) => m.type.name === 'bookmark')
    const name = mark?.attrs.name as string | undefined

    if (name && open && open.name === name && open.to === pos) {
      open.to = pos + node.nodeSize
    } else {
      if (open) entries.push(open)
      open = name ? { name, from: pos, to: pos + node.nodeSize } : null
    }
  })
  if (open) entries.push(open)
  return entries
}

export function listComments(editor: Editor): CommentEntry[] {
  const entries: CommentEntry[] = []
  let open: CommentEntry | null = null

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return
    const mark = node.marks.find((m) => m.type.name === 'comment')
    const commentId = mark?.attrs.commentId as string | undefined

    if (commentId && open && open.commentId === commentId && open.to === pos) {
      open.to = pos + node.nodeSize
    } else {
      if (open) entries.push(open)
      open = commentId
        ? {
            commentId,
            author: (mark?.attrs.author as string) ?? 'Docfile User',
            text: (mark?.attrs.text as string) ?? '',
            from: pos,
            to: pos + node.nodeSize
          }
        : null
    }
  })
  if (open) entries.push(open)
  return entries
}

export function goToRange(editor: Editor, from: number, to: number): void {
  editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run()
}

export function removeMarkRange(editor: Editor, markName: string, from: number, to: number): void {
  editor.chain().focus().setTextSelection({ from, to }).unsetMark(markName).setTextSelection(from).run()
}
