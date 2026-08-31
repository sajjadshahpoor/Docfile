import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Group, GroupDivider, ToolbarButton } from './shared'
import ShortcutsDialog from './ShortcutsDialog'
import AboutModal from '../../../components/AboutModal'

interface HelpTabProps {
  editor: Editor
}

type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

function statusLabel(status: UpdateStatus | null): string | null {
  if (!status) return null
  switch (status.state) {
    case 'checking':
      return 'Checking for updates…'
    case 'not-available':
      return "You're up to date."
    case 'available':
      return `Update v${status.version} found — downloading…`
    case 'downloading':
      return `Downloading update… ${status.percent}%`
    case 'downloaded':
      return `Update v${status.version} ready — restart to install.`
    case 'error':
      return 'Could not check for updates. Check your connection.'
  }
}

export default function HelpTab({ editor }: HelpTabProps): JSX.Element {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    if (!window.docfile?.onUpdateStatus) return
    const unsubscribe = window.docfile.onUpdateStatus(setUpdateStatus)
    return unsubscribe
  }, [])

  const checkForUpdates = (): void => {
    setUpdateStatus({ state: 'checking' })
    window.docfile.checkForUpdates()
  }

  const restartAndInstall = (): void => {
    window.docfile.restartAndInstallUpdate()
  }

  const reportIssue = (): void => {
    window.docfile.openExternal('https://github.com/sajjadshahpoor/Docfile/issues/new')
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Help">
        <ToolbarButton title="Keyboard Shortcuts" onClick={() => setShortcutsOpen(true)}>
          ⌨ Keyboard Shortcuts
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Updates">
        <ToolbarButton title="Check for Updates" onClick={checkForUpdates}>
          ⟳ Check for Updates
        </ToolbarButton>
        {updateStatus?.state === 'downloaded' && (
          <ToolbarButton title="Restart & Install" onClick={restartAndInstall}>
            Restart & Install
          </ToolbarButton>
        )}
        {statusLabel(updateStatus) && (
          <span className="ml-1 max-w-[220px] text-xs text-gray-500">{statusLabel(updateStatus)}</span>
        )}
      </Group>

      <GroupDivider />

      <Group label="Feedback">
        <ToolbarButton title="Report an Issue on GitHub" onClick={reportIssue}>
          ⚑ Report an Issue
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="About">
        <ToolbarButton title="About Docfile" onClick={() => setAboutOpen(true)}>
          ⓘ About Docfile
        </ToolbarButton>
      </Group>

      {shortcutsOpen && (
        <ShortcutsDialog
          onClose={() => {
            setShortcutsOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {aboutOpen && (
        <AboutModal
          onClose={() => {
            setAboutOpen(false)
            editor.commands.focus()
          }}
        />
      )}
    </div>
  )
}
