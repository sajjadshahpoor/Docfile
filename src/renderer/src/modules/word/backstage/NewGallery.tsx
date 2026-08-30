import { BLANK_TEMPLATE, TEMPLATES, type DocTemplate } from '../templates'

interface NewGalleryProps {
  onPick: (template: DocTemplate) => void
}

function Thumbnail({ template }: { template: DocTemplate }): JSX.Element {
  if (template.id === 'blank') {
    return <div className="h-full w-full bg-white" />
  }
  return (
    <div className="flex h-full w-full flex-col gap-1 overflow-hidden bg-white p-2">
      {template.thumbnailLines.map((line, i) => (
        <div
          key={i}
          className={`truncate text-[5px] leading-tight text-gray-700 ${line.bold ? 'font-bold' : ''} ${
            line.align === 'center' ? 'text-center' : 'text-left'
          }`}
        >
          {line.text}
        </div>
      ))}
    </div>
  )
}

export default function NewGallery({ onPick }: NewGalleryProps): JSX.Element {
  const tiles = [BLANK_TEMPLATE, ...TEMPLATES]

  return (
    <div className="flex flex-wrap gap-5">
      {tiles.map((template) => (
        <button
          key={template.id}
          onClick={() => onPick(template)}
          className="flex w-32 flex-col items-center gap-2 text-left"
        >
          <div className="h-40 w-32 overflow-hidden rounded border border-gray-300 shadow-sm transition hover:shadow-md">
            <Thumbnail template={template} />
          </div>
          <span className="text-xs text-gray-700">{template.label}</span>
        </button>
      ))}
    </div>
  )
}
