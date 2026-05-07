function getSvgSize(svg: string) {
  const documentElement = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
  const viewBox = documentElement.getAttribute('viewBox')?.split(/\s+/).map(Number)
  const widthAttribute = documentElement.getAttribute('width') ?? ''
  const heightAttribute = documentElement.getAttribute('height') ?? ''
  const width = widthAttribute.includes('%') ? Number.NaN : Number.parseFloat(widthAttribute)
  const height = heightAttribute.includes('%') ? Number.NaN : Number.parseFloat(heightAttribute)

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { height, width }
  }

  if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) {
    return { height: viewBox[3], width: viewBox[2] }
  }

  return { height: 800, width: 1200 }
}

export function getDownloadFilename(projectName: string, extension: string) {
  const safeName = projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/-+/g, '-')

  return `${safeName || 'diagramix'}.${extension}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}

export async function svgToPngBlob(svg: string) {
  const { height, width } = getSvgSize(svg)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = new Image()
    const loadedImage = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Не удалось подготовить SVG для PNG-экспорта'))
    })

    image.src = svgUrl
    await loadedImage

    const canvas = document.createElement('canvas')
    const scale = Math.max(window.devicePixelRatio || 1, 2)
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Браузер не поддерживает PNG-экспорт через canvas')
    }

    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.drawImage(image, 0, 0, width, height)

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })

    if (!pngBlob) {
      throw new Error('Не удалось создать PNG-файл')
    }

    return pngBlob
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
