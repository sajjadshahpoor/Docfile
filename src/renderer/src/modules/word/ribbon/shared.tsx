import type { ReactNode } from 'react'

export function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-office-word/10 text-office-word' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export function Divider(): JSX.Element {
  return <div className="mx-1 h-6 w-px bg-gray-200" />
}

export function Group({
  label,
  children
}: {
  label: string
  children: ReactNode
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <div className="flex flex-wrap items-center gap-1">{children}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  )
}

export function GroupDivider(): JSX.Element {
  return <div className="mx-1 h-14 w-px self-stretch bg-gray-200" />
}
