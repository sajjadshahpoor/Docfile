import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Some environments (this machine included) have ELECTRON_RUN_AS_NODE set
// globally. Electron treats that variable as "set" even when its value is an
// empty string, so it must be deleted from the env object entirely (not just
// cleared) before spawning electron-vite, or the Electron window never opens.
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const __dirname = dirname(fileURLToPath(import.meta.url))
const electronViteBin = join(__dirname, '..', 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')

const args = process.argv.slice(2)
const child = spawn(process.execPath, [electronViteBin, ...args], {
  stdio: 'inherit',
  env
})

child.on('exit', (code) => process.exit(code ?? 0))
