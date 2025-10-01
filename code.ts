let iframeSize: { height: number, width: number } = { height: 75, width: 960 }
let frameNode: FrameNode | ComponentNode | InstanceNode | null = null

figma.showUI(__html__, { width: iframeSize.width, height: iframeSize.height })
// figma.showUI(__html__, { width: 960, height: 560 })

figma.on('selectionchange', () => {

  const selection = figma.currentPage.selection
  if (selection.length === 1 && (selection[0].type === 'FRAME' || selection[0].type === 'COMPONENT' || selection[0].type === 'INSTANCE')) {
    frameNode = selection[0]
    figma.ui.postMessage({ msgType: "selection", type: frameNode.type, name: frameNode.name })
  }
  else {figma.ui.postMessage({ msgType: "clear" }) }
})

figma.ui.onmessage = msg => {
  if (msg.type === 'generate') {
    const animateResize = setInterval(resizeIframe, 1)
    function resizeIframe() {
      iframeSize.height += 8
      figma.ui.resize(iframeSize.width, iframeSize.height)
      if (iframeSize.height >= 560) {clearInterval(animateResize)}
    }

    generateCodeForFrame(frameNode)

  }

  else if (msg.type === 'saveCode') {
    figma.clientStorage.setAsync(msg.id, msg.code)
  }

  else if (msg.type === 'viewCode') {
    figma.clientStorage.getAsync(msg.id).then((code) => {
      if (code) { figma.ui.postMessage({ msgType: 'code', code }) }
      else { figma.ui.postMessage({ msgType: 'nocode' }) }
    })
  }

  else if (msg.type === 'makeSmall') {
    if (iframeSize.width <= 960) return
    const animateResize = setInterval(resizeIframe, 1)
    function resizeIframe() {
      iframeSize.width -= 8
      figma.ui.resize(iframeSize.width, iframeSize.height)
      if (iframeSize.width <= 960) {clearInterval(animateResize)}
    }
  }

  else if (msg.type === 'makeLarge') {
    if (iframeSize.width >= 1440) return
    const animateResize = setInterval(resizeIframe, 1)
    function resizeIframe() {
      iframeSize.width += 8
      figma.ui.resize(iframeSize.width, iframeSize.height)
      if (iframeSize.width >= 1440) {clearInterval(animateResize)}
    }
  }
}

async function generateCodeForFrame(node: FrameNode | ComponentNode | InstanceNode | null) {
  if (!node) return

  const cssChunks: string[] = []
  const html = await nodeToHTMLWithClasses(node, cssChunks, true)
  const css = cssChunks.join('')

  const generatedCode = { html, css }
  figma.ui.postMessage({ msgType: 'code', code: generatedCode })

}

// ----- Class-based HTML + CSS generation helpers --------------------------

function makeClassName(node: SceneNode): string {
  const base = ('name' in node && node.name ? node.name : node.type).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
  const shortId = String(node.id).replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase()
  return `${base}-${shortId}`
}

async function nodeToHTMLWithClasses(node: SceneNode, cssChunks: string[], isRoot = false): Promise<string> {
  const cls = makeClassName(node)
  await appendNodeCss(node, cls, cssChunks)

  switch (node.type) {
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
    case 'BOOLEAN_OPERATION':
    case 'SECTION': {
      const kids = 'children' in node ? node.children : []
      const inner = await childrenToHTMLWithClasses(kids, cssChunks)
      return `\n<div class="${cls}">\n${inner}\n</div>`
    }

    case 'TEXT': {
      const text = (node as TextNode).characters ?? ''
      return `\n<span class="${cls}">${escapeHtml(text)}</span>`
    }

    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'POLYGON':
    case 'STAR':
    case 'VECTOR':
    case 'LINE':
    case 'SLICE': {
      return `\n<div class="${cls}"></div>`
    }

    default: {
      const kids = 'children' in node ? (node as any).children as readonly SceneNode[] : []
      const inner = kids.length ? await childrenToHTMLWithClasses(kids, cssChunks) : ''
      return `\n<div class="${cls}">\n${inner}\n</div>`
    }
  }
}

async function childrenToHTMLWithClasses(children: readonly SceneNode[], cssChunks: string[]): Promise<string> {
  const parts: string[] = []
  for (const child of children) parts.push(await nodeToHTMLWithClasses(child, cssChunks, false))
  return parts.join('')
}

async function appendNodeCss(node: SceneNode, className: string, cssChunks: string[]) {
  try {
    const css = await (node as any).getCSSAsync?.()
    if (!css) return
    let block = `.${className} {\n`
    for (const prop in css as Record<string, string>) {
      if (Object.prototype.hasOwnProperty.call(css, prop)) {
        const value = (css as Record<string, string>)[prop]
        block += `  ${prop}: ${value};\n`
      }
    }
    block += `}\n`
    cssChunks.push(block)
  } catch {}
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text)
}

// figma.closePlugin()
