let iframeSize: { height: number, width: number } = { height: 75, width: 960 }

figma.showUI(__html__, { width: iframeSize.width, height: iframeSize.height })
// figma.showUI(__html__, { width: 960, height: 560 })

figma.on('selectionchange', () => {

  const selection = figma.currentPage.selection
  if (selection.length === 1 && (selection[0].type === 'FRAME' || selection[0].type === 'COMPONENT')) {
    const frame = selection[0]
    figma.ui.postMessage({ selection: true, type: frame.type, name: frame.name })
  }
  else {figma.ui.postMessage({ selection: false }) }
})

figma.ui.onmessage = msg => {
  if (msg.type === 'generate') {
    const animateResize = setInterval(resizeIframe, 1)
    function resizeIframe() {
      iframeSize.height += 8
      figma.ui.resize(iframeSize.width, iframeSize.height)
      if (iframeSize.height >= 560) {clearInterval(animateResize)}
    }
  }
}

// figma.closePlugin()
