import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Launcher from './modules/launcher/Launcher'
import WordEditor from './modules/word/WordEditor'

function App(): JSX.Element {
  const view = useAppStore((s) => s.view)
  const refreshRecents = useAppStore((s) => s.refreshRecents)

  useEffect(() => {
    refreshRecents()
  }, [refreshRecents])

  switch (view.screen) {
    case 'word':
      return <WordEditor filePath={view.filePath} />
    case 'excel':
    case 'powerpoint':
      // Not implemented yet — Phase 2/3 of the plan.
      return <Launcher />
    default:
      return <Launcher />
  }
}

export default App
