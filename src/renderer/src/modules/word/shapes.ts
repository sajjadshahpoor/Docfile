export type ShapeKind = 'rectangle' | 'oval' | 'line' | 'arrow'

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  rectangle: 'Rectangle',
  oval: 'Oval',
  line: 'Line',
  arrow: 'Arrow'
}

const SHAPE_SIZE = { width: 160, height: 100 }

function shapeSvg(kind: ShapeKind): string {
  const { width, height } = SHAPE_SIZE
  const fill = '#DCE6F7'
  const stroke = '#2E5B9A'

  switch (kind) {
    case 'rectangle':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="${fill}" stroke="${stroke}" stroke-width="3"/></svg>`
    case 'oval':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - 4}" ry="${height / 2 - 4}" fill="${fill}" stroke="${stroke}" stroke-width="3"/></svg>`
    case 'line':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><line x1="4" y1="${height - 4}" x2="${width - 4}" y2="4" stroke="${stroke}" stroke-width="4"/></svg>`
    case 'arrow':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><line x1="4" y1="${height / 2}" x2="${width - 24}" y2="${height / 2}" stroke="${stroke}" stroke-width="6"/><polygon points="${width - 30},${height / 2 - 16} ${width - 4},${height / 2} ${width - 30},${height / 2 + 16}" fill="${stroke}"/></svg>`
  }
}

// docx's writer only accepts png/jpg/gif/bmp image bytes (see docxExport.ts
// buildImageRun), so shapes are rasterized to PNG through an offscreen
// canvas rather than inserted as raw SVG — that keeps them on the exact
// same, already-verified image export path as inserted pictures.
export function shapeToPngDataUrl(kind: ShapeKind): Promise<string> {
  const svg = shapeSvg(kind)
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = SHAPE_SIZE.width
      canvas.height = SHAPE_SIZE.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to rasterize shape'))
    img.src = svgDataUrl
  })
}
