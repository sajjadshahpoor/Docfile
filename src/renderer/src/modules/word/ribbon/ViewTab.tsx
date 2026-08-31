import {
  DocumentPageNumber20Regular,
  Globe20Regular,
  DocumentEdit20Regular,
  BookOpen20Regular,
  Ruler20Regular,
  Grid20Regular,
  PanelLeft20Regular,
  ZoomIn20Regular,
  ZoomOut20Regular,
  ZoomFit20Regular
} from '@fluentui/react-icons'
import { Group, GroupDivider, ToolbarButton } from './shared'
import type { ViewMode, ViewSettings } from '../viewSettings'

interface ViewTabProps {
  view: ViewSettings
  onViewChange: (next: ViewSettings) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFitPageWidth: () => void
}

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof DocumentPageNumber20Regular }[] = [
  { id: 'print', label: 'Print Layout', icon: DocumentPageNumber20Regular },
  { id: 'web', label: 'Web Layout', icon: Globe20Regular },
  { id: 'draft', label: 'Draft', icon: DocumentEdit20Regular },
  { id: 'read', label: 'Read Mode', icon: BookOpen20Regular }
]

export default function ViewTab({ view, onViewChange, zoom, onZoomChange, onFitPageWidth }: ViewTabProps): JSX.Element {
  const setMode = (mode: ViewMode): void => onViewChange({ ...view, mode })

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Views">
        {VIEW_MODES.map((m) => (
          <ToolbarButton key={m.id} title={m.label} icon={m.icon} active={view.mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </ToolbarButton>
        ))}
      </Group>

      <GroupDivider />

      <Group label="Show">
        <ToolbarButton
          title="Ruler"
          icon={Ruler20Regular}
          active={view.showRuler}
          disabled={view.mode === 'draft' || view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showRuler: !view.showRuler })}
        >
          Ruler
        </ToolbarButton>
        <ToolbarButton
          title="Gridlines"
          icon={Grid20Regular}
          active={view.showGridlines}
          disabled={view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showGridlines: !view.showGridlines })}
        >
          Gridlines
        </ToolbarButton>
        <ToolbarButton
          title="Navigation Pane"
          icon={PanelLeft20Regular}
          active={view.showNavPane}
          disabled={view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showNavPane: !view.showNavPane })}
        >
          Navigation Pane
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Zoom">
        <ToolbarButton title="Zoom out" icon={ZoomOut20Regular} onClick={() => onZoomChange(Math.max(50, zoom - 10))} />
        <span className="w-12 text-center text-sm text-gray-700">{zoom}%</span>
        <ToolbarButton title="Zoom in" icon={ZoomIn20Regular} onClick={() => onZoomChange(Math.min(200, zoom + 10))} />
        <ToolbarButton title="Reset zoom to 100%" onClick={() => onZoomChange(100)}>
          100%
        </ToolbarButton>
        <ToolbarButton title="Page Width — fit the page to the window" icon={ZoomFit20Regular} onClick={onFitPageWidth}>
          Page Width
        </ToolbarButton>
      </Group>
    </div>
  )
}
