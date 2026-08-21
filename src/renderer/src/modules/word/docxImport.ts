import mammoth from 'mammoth'

export interface DocxImportResult {
  html: string
  warnings: string[]
}

export async function importDocx(data: Uint8Array): Promise<DocxImportResult> {
  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer

  const result = await mammoth.convertToHtml({ arrayBuffer })

  return {
    html: result.value,
    warnings: result.messages.filter((m) => m.type === 'warning').map((m) => m.message)
  }
}
