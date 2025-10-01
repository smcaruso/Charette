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
}

async function generateCodeForFrame(node: FrameNode | ComponentNode | InstanceNode | null) {
  if (!node) return
  const className = node.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
  const generatedCode: {html: string, css: string} = { html: `<div class="${className}">sample code</div>`, css: '' }

  frameNode?.getCSSAsync().then(css => {
    generatedCode.css = `.${className} {\n`
    for (const prop in css) {
      if (Object.prototype.hasOwnProperty.call(css, prop)) {
        const value = (css as Record<string, string>)[prop]
        generatedCode.css += `  ${prop}: ${value};\n`
      }
    }
    generatedCode.css += `}`
    figma.ui.postMessage({ msgType: "code", code: generatedCode })
  })

  figma.variables.getLocalVariablesAsync().then(vars => {
    console.log('Local variables:', vars)
  })
  
}

// figma.closePlugin()
