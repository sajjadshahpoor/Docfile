import type { DocTemplate } from '../templates'
import NewGallery from './NewGallery'

interface NewPanelProps {
  onPickTemplate: (template: DocTemplate) => void
}

export default function NewPanel({ onPickTemplate }: NewPanelProps): JSX.Element {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">New</h1>
      <NewGallery onPick={onPickTemplate} />
    </div>
  )
}
