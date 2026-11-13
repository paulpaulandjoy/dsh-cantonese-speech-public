window.__ModuleLoader__.load({
  id: '@local/cantonese-speech',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef } = React

    const ENDPOINT = '/local-speech'
    const PULSE_CSS = `
@keyframes dshSpeechPickPulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-brand-primary) 0%, transparent); }
  50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent); }
}
.dsh-speech-pick { animation: dshSpeechPickPulse 1.1s ease-in-out infinite; }
html.dsh-speech-picking,
html.dsh-speech-picking * {
  cursor: crosshair !important;
  -webkit-user-select: none !important;
  user-select: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .dsh-speech-pick { animation: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent); }
}
`
    const MESSAGE_SELECTORS = [
      '[data-message-bubble]',
      '[data-message-id]',
      '[data-message-role]',
      '[data-testid*="message" i]',
      'article',
      '[role="article"]',
      '[class*="markdown" i]',
      '[class*="message" i]',
      '[data-chat-node-key]',
    ]
    const BLOCK_SELECTOR =
      'p, li, blockquote, td, th, h1, h2, h3, h4, h5, h6, figcaption, dt, dd'

    async function request(action, value, body) {
      const params = new URLSearchParams({ action })
      if (value !== undefined) params.set('value', String(value))
      const headers = { accept: 'application/json' }
      const options = {
        method: action === 'status' ? 'GET' : 'POST',
        cache: 'no-store',
        headers,
      }
      if (body !== undefined) {
        headers['content-type'] = 'application/json'
        options.body = JSON.stringify(body)
      }
      const response = await fetch(`${ENDPOINT}?${params}`, options)
      if (!response.ok) throw new Error(`speech request failed: ${response.status}`)
      return response.json()
    }

    function iconStyle(disabled) {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 7,
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-secondary)',
        font: 'inherit',
        fontSize: 13,
        lineHeight: 1,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.38 : 1,
      }
    }

    function speakerIcon(on) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          key: 'body',
          d: 'M4 9.25h3.1L12 5.5v13l-4.9-3.75H4a1 1 0 0 1-1-1v-3.5a1 1 0 0 1 1-1Z',
          fill: 'currentColor',
          stroke: 'none',
        }),
        on
          ? h('path', { key: 'wave1', d: 'M15.5 9a4 4 0 0 1 0 6' })
          : h('path', { key: 'slash', d: 'm14.5 9.5 5 5m0-5-5 5' }),
        on
          ? h('path', { key: 'wave2', d: 'M18 6.5a7.5 7.5 0 0 1 0 11' })
          : null,
      )
    }

    function stopIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 16,
          height: 16,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('rect', {
          x: 7.5,
          y: 7.5,
          width: 9,
          height: 9,
          rx: 1,
          fill: 'currentColor',
        }),
      )
    }

    function pointerHandIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 17,
          height: 17,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', { key: 'index', d: 'M10 12.5V5.5a2 2 0 0 1 4 0v7' }),
        h('path', {
          key: 'hand',
          d: 'M10 12.5V11a1.75 1.75 0 0 0-3.5 0v3.5a5.5 5.5 0 0 0 5.5 5.5h2a4.5 4.5 0 0 0 4.5-4.5v-3',
        }),
      )
    }

    function followIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', { key: 'shaft', d: 'M12 3.5v12.5' }),
        h('path', { key: 'head', d: 'm6.8 11.2 5.2 5.2 5.2-5.2' }),
        h('path', { key: 'floor', d: 'M5 20.5h14' }),
      )
    }

    function elementText(el) {
      return String(el?.innerText ?? el?.textContent ?? '')
        .replace(/\u00a0/g, ' ')
        .trim()
    }

    function isSaneElement(el) {
      if (!(el instanceof HTMLElement)) return false
      if (el.matches('html, body, main')) return false
      const text = elementText(el)
      if (text.length === 0 || text.length > 12000) return false
      const rect = el.getBoundingClientRect()
      if (rect.width < 24 || rect.height < 12) return false
      if (el.querySelectorAll('article, [data-message-id]').length > 4) return false
      return true
    }

    function closestSane(el, selectors) {
      for (const selector of selectors) {
        let found
        try {
          found = el.closest(selector)
        } catch {
          continue
        }
        if (found && isSaneElement(found)) return found
      }
      return null
    }

    function findTextContainer(target) {
      if (!(target instanceof Element)) return null
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return null

      // Sidebar document previews are one reading unit: a clicked block reads
      // that section, while a click on blank space reads the whole document.
      const preview = sidebarPreviewFor(target)
      if (preview !== null) {
        const doc = sidebarDocumentFor(preview)
        // Only Markdown and plain text previews can be read; PDF/Office/image
        // previews stay untouched instead of reading their toolbar labels.
        if (doc === null) return null
        const pre = target.closest('pre')
        if (pre && isSaneElement(pre)) return pre
        const block = target.closest(BLOCK_SELECTOR)
        if (block && isSaneElement(block)) return block
        const line = target.closest('[data-textpreview-line]')
        if (line && isSaneElement(line)) return line
        const page = target.closest('[data-pdf-page]')
        if (page !== null) return page.querySelector('[data-pdf-text]') ?? page
        return doc
      }

      // A code block is its own reading unit, even inside a message.
      const pre = target.closest('pre')
      if (pre && isSaneElement(pre)) return pre

      // Otherwise prefer the whole message body when one is identifiable.
      const message = closestSane(target, MESSAGE_SELECTORS)
      if (message) return message

      const block = target.closest(BLOCK_SELECTOR)
      if (block && isSaneElement(block)) return block

      // Do not read toolbar or navigation controls as text.
      if (target.closest('button, [role="button"], a, svg, select')) return null

      let el = target
      while (el && el !== document.body) {
        if (isSaneElement(el)) return el
        el = el.parentElement
      }
      return null
    }

    function extractText(el) {
      return elementText(el)
    }

    /**
     * Text used for a pick. Markdown frontmatter is a small metadata grid, not
     * part of the prose, so a whole-document read starts at the body.
     */
    /**
     * PDF.js lays its selectable text out as absolutely positioned spans, so
     * innerText treats every span as a block and inserts a newline between
     * characters. Read the raw text instead and only keep meaningful spaces.
     */
    function normalizePdfText(raw) {
      return String(raw ?? '')
        .replace(/\s+/g, ' ')
        .replace(/(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '')
        .replace(/\s+([，。！？；：、])/g, '$1')
        .trim()
    }

    function pdfTextOf(el) {
      const layers = el.matches('[data-pdf-text]')
        ? [el]
        : Array.from(el.querySelectorAll('[data-pdf-text]'))
      const parts = []
      for (const layer of layers) {
        const text = normalizePdfText(layer.textContent ?? '')
        if (text !== '') parts.push(text)
      }
      return parts.join('\n\n')
    }

    const PDF_READ_CHARS = 8000

    function pdfPageHasText(page) {
      const layer = page.querySelector('[data-pdf-text]')
      return layer !== null && (layer.textContent ?? '').trim() !== ''
    }

    /** Render one lazily loaded page and wait until its text layer exists. */
    function waitForPdfPageText(page) {
      if (pdfPageHasText(page)) return Promise.resolve(true)
      page.scrollIntoView({ block: 'center' })
      return new Promise((resolve) => {
        const deadline = Date.now() + 2500
        const tick = () => {
          if (pdfPageHasText(page)) return resolve(true)
          if (Date.now() > deadline) return resolve(false)
          window.setTimeout(tick, 60)
        }
        tick()
      })
    }

    /**
     * Read a PDF from the picked page onwards. Pages are rendered one at a
     * time because the preview only builds a text layer near the viewport.
     */
    async function collectPdfText(startEl) {
      const section =
        startEl.closest('[data-pdf-preview]') ??
        startEl.querySelector?.('[data-pdf-preview]') ??
        startEl
      const pages = Array.from(section.querySelectorAll('[data-pdf-page]'))
      if (pages.length === 0) return pdfTextOf(section)
      const picked = startEl.closest('[data-pdf-page]')
      const startIndex = picked === null ? 0 : Math.max(0, pages.indexOf(picked))
      const parts = []
      let total = 0
      for (const page of pages.slice(startIndex)) {
        if (!pdfPageHasText(page)) await waitForPdfPageText(page)
        const text = pdfTextOf(page)
        if (text !== '') {
          parts.push(text)
          total += text.length + 2
        }
        if (total >= PDF_READ_CHARS) break
      }
      pages[startIndex]?.scrollIntoView({ block: 'start' })
      return parts.join('\n\n').slice(0, PDF_READ_CHARS)
    }

    function readableText(el) {
      if (!(el instanceof Element)) return ''
      if (el.matches('[data-pdf-preview], [data-pdf-page], [data-pdf-text]')) {
        return pdfTextOf(el)
      }
      if (el.matches('[data-document-markdown]')) {
        const parts = []
        for (const child of el.children) {
          if (child.matches('[data-document-frontmatter]')) continue
          const text = elementText(child)
          if (text !== '') parts.push(text)
        }
        return parts.join('\n\n')
      }
      return elementText(el)
    }

    const LATEST_SELECTORS = [
      '[data-chat-flow-kind*="assistant" i]',
      '.markdown',
      '[class*="markdown" i]',
      '[data-message-bubble]',
      '[data-chat-node-key]',
    ]

    function browserCleanReply(raw) {
      let text = String(raw ?? '')
      text = text.replace(/```[\s\S]*?```/g, '\n')
      text = text.replace(/~~~[\s\S]*?~~~/g, '\n')
      text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      text = text.replace(/<https?:\/\/[^>]*>/g, '')
      text = text.replace(/https?:\/\/\S+/g, '')
      text = text.replace(/`([^`]+)`/g, '$1')
      text = text.replace(/^#{1,6}\s+/gm, '')
      text = text.replace(/^\s*[-*+]\s+/gm, '')
      text = text.replace(/^\s*\d+[.)]\s+/gm, '')
      text = text.replace(/^\s*\|.*\|\s*$/gm, '')
      text = text.replace(/[*_~#>|]/g, '')
      text = text.replace(/[ \t]+\n/g, '\n')
      return text.replace(/\n{3,}/g, '\n\n').trim()
    }

    function browserCleanSelection(raw) {
      let text = String(raw ?? '').replace(/\r\n?/g, '\n')
      text = text.replace(/<https?:\/\/[^>]*>/g, ' ')
      text = text.replace(/https?:\/\/\S+/g, ' ')
      text = text.replace(/[ \t]+/g, ' ')
      text = text.replace(/ *\n */g, '\n')
      return text.replace(/\n{3,}/g, '\n\n').trim()
    }

    function splitBrowserChunks(text) {
      const result = []
      for (const paragraph of String(text ?? '').split(/\n+/)) {
        const sentences = paragraph
          .split(/(?<=[。！？；!?;])\s*|(?<=\.)\s+/u)
          .map((part) => part.trim())
          .filter(Boolean)
        for (const sentence of sentences) {
          let rest = sentence
          while (rest.length > 70) {
            let cut = rest.lastIndexOf(' ', 70)
            if (cut < 30) cut = 70
            result.push(rest.slice(0, cut).trim())
            rest = rest.slice(cut).trim()
          }
          if (rest !== '') result.push(rest)
        }
      }
      return result.filter(Boolean)
    }

    function pickBrowserVoice(text, voices) {
      const han = (text.match(/[\u3400-\u9fff]/g) ?? []).length
      const preferences = han
        ? ['zh-HK', 'yue-HK', 'zh-TW', 'zh-CN']
        : ['en-US', 'en-GB', 'en-AU']
      for (const prefix of preferences) {
        const voice = voices.find(
          (candidate) =>
            typeof candidate.lang === 'string' &&
            candidate.lang.toLowerCase().startsWith(prefix.toLowerCase()),
        )
        if (voice) return voice
      }
      if (han) {
        return (
          voices.find((candidate) => /sinji|粵|粤|cantonese/i.test(candidate.name ?? '')) ??
          null
        )
      }
      return voices.find((candidate) => /samantha|english/i.test(candidate.name ?? '')) ?? null
    }

    function latestAssistantNode() {
      for (const selector of LATEST_SELECTORS) {
        const nodes = Array.from(document.querySelectorAll(selector)).filter(
          (el) => el instanceof HTMLElement && elementText(el) !== '',
        )
        if (nodes.length > 0) {
          const element = nodes[nodes.length - 1]
          return { element, text: elementText(element) }
        }
      }
      return null
    }

    function latestAssistantText() {
      return latestAssistantNode()?.text ?? ''
    }

    // ------------------------------------------------------------------
    // Spoken-sentence highlight
    //
    // The spoken chunk is matched back to the rendered message and wrapped
    // in an inline span with a bold red underline. Underlining leaves the
    // glyphs untouched, unlike a background overlay.
    // ------------------------------------------------------------------
    const HL_ATTR = 'data-dsh-speech-hl'
    const HL_COLOR = '#e11d48'

    // Remembers what was last highlighted so the locate button can restore
    // the mark if React re-rendered the message and dropped the wrapper.
    const speechHighlight = { text: '', root: null }

    function clearSpeechHighlight() {
      for (const span of Array.from(document.querySelectorAll(`[${HL_ATTR}]`))) {
        const parent = span.parentNode
        if (parent === null) continue
        while (span.firstChild !== null) parent.insertBefore(span.firstChild, span)
        parent.removeChild(span)
      }
      speechHighlight.text = ''
      speechHighlight.root = null
    }

    function normalizedSpeechText(value) {
      // browserCleanReply strips these markdown markers, so the rendered DOM
      // side skips them too and the spoken chunk stays locatable.
      return String(value ?? '').replace(/[\s\u00a0*_~#>|]+/g, '')
    }

    function textIndexMap(root) {
      const positions = []
      let text = ''
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node !== null) {
        const value = node.nodeValue ?? ''
        for (let i = 0; i < value.length; i += 1) {
          const char = value[i]
          if (/[\s\u00a0*_~#>|]/.test(char)) continue
          // The cleaner drops bare and angle-bracket URLs, so skip them here
          // too; otherwise a chunk spanning a URL could not be located.
          const url = /^https?:\/\/\S+/.exec(value.slice(i))
          if (url !== null) {
            i += url[0].length - 1
            continue
          }
          text += char
          positions.push({ node, offset: i })
        }
        node = walker.nextNode()
      }
      return { text, positions }
    }

    function findSpeechRange(root, chunk, fromIndex = 0) {
      if (!(root instanceof Element) || !root.isConnected) return null
      const needle = normalizedSpeechText(chunk)
      if (needle === '') return null
      const map = textIndexMap(root)
      if (map.text === '') return null

      const makeRange = (start, size) => {
        const first = map.positions[start]
        const last = map.positions[start + size - 1]
        if (first === undefined || last === undefined) return null
        const range = document.createRange()
        range.setStart(first.node, first.offset)
        range.setEnd(last.node, last.offset + 1)
        return { range, end: start + size }
      }

      const from = Math.max(0, Math.min(fromIndex, map.text.length))
      const exact = map.text.indexOf(needle, from)
      if (exact >= 0) return makeRange(exact, needle.length)

      // The spoken text drops URLs and markdown markers, so a chunk can differ
      // from the rendered text in the middle. Anchor on its head and tail.
      const anchorLen = Math.max(1, Math.ceil(needle.length / 2))
      const headLen = Math.min(needle.length, 12, anchorLen)
      const tailLen = Math.min(needle.length, 12, anchorLen)
      const head = needle.slice(0, headLen)
      const tail = needle.slice(-tailLen)
      let headIndex = map.text.indexOf(head, from)
      if (headIndex < 0) headIndex = map.text.indexOf(head)
      if (headIndex >= 0) {
        const tailFrom = headIndex + 1
        const tailIndex = map.text.indexOf(tail, tailFrom)
        const windowEnd = Math.min(
          map.text.length,
          headIndex + needle.length + tailLen + 120,
        )
        if (tailIndex >= tailFrom && tailIndex + tailLen <= windowEnd) {
          const anchored = makeRange(headIndex, tailIndex + tailLen - headIndex)
          if (anchored !== null) return anchored
        }
      }

      // Last resort: a shorter prefix still points at the right sentence.
      for (const size of [24, 16, 12, 8]) {
        if (size >= needle.length) continue
        const probe = needle.slice(0, size)
        let index = map.text.indexOf(probe, from)
        if (index < 0) index = map.text.indexOf(probe)
        if (index < 0) continue
        const prefix = makeRange(index, size)
        if (prefix !== null) return prefix
      }
      return null
    }

    function createHighlightSpan() {
      const span = document.createElement('span')
      span.setAttribute(HL_ATTR, '')
      span.style.fontWeight = '700'
      span.style.background = 'transparent'
      span.style.textDecorationLine = 'underline'
      span.style.textDecorationColor = HL_COLOR
      span.style.textDecorationThickness = '3px'
      span.style.textUnderlineOffset = '4px'
      return span
    }

    /**
     * Wrap only the text nodes the range touches. Moving element nodes into a
     * wrapper would restructure grids, tables and PDF text layers, which made
     * the surrounding document inherit the wrong font or position.
     */
    function applySpeechHighlight(range) {
      clearSpeechHighlight()
      if (range === null) return null
      const anchor =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer
      if (!(anchor instanceof Element)) return null
      const tasks = []
      const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node !== null) {
        if (range.intersectsNode(node)) {
          const start =
            node === range.startContainer ? range.startOffset : 0
          const end =
            node === range.endContainer ? range.endOffset : node.nodeValue.length
          if (end > start) tasks.push({ node, start, end })
        }
        node = walker.nextNode()
      }
      let first = null
      for (const task of tasks) {
        if (!task.node.isConnected) continue
        const length = task.node.nodeValue.length
        const start = Math.max(0, Math.min(task.start, length))
        const end = Math.max(start, Math.min(task.end, length))
        if (end <= start) continue
        const piece = document.createRange()
        piece.setStart(task.node, start)
        piece.setEnd(task.node, end)
        const span = createHighlightSpan()
        try {
          piece.surroundContents(span)
        } catch {
          continue
        }
        if (first === null) first = span
      }
      return first
    }

    function highlightSpeechChunk(root, chunk, fromIndex = 0) {
      // Remove the previous mark before locating, so the new range is computed
      // against the clean message DOM.
      clearSpeechHighlight()
      if (!(root instanceof Element)) return fromIndex
      const found = findSpeechRange(root, chunk, fromIndex)
      if (found === null) return fromIndex
      if (applySpeechHighlight(found.range) === null) return fromIndex
      speechHighlight.text = String(chunk ?? '')
      speechHighlight.root = root
      return found.end
    }

    function revealSpeechHighlight() {
      let span = document.querySelector(`[${HL_ATTR}]`)
      if (span === null && speechHighlight.text !== '') {
        const stored =
          speechHighlight.root instanceof Element && speechHighlight.root.isConnected
            ? speechHighlight.root
            : null
        const root = stored ?? latestAssistantNode()?.element ?? null
        if (root !== null) {
          const found = findSpeechRange(root, speechHighlight.text, 0)
          if (found !== null) span = applySpeechHighlight(found.range)
        }
      }
      if (span === null) return false
      span.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
      return true
    }

    /** The internal scroller that owns an element, or null for the page. */
    function scrollContainerOf(el) {
      let node = el.parentElement
      while (
        node !== null &&
        node !== document.body &&
        node !== document.documentElement
      ) {
        const style = window.getComputedStyle(node)
        const overflow = style.overflowY
        if (
          (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') &&
          node.scrollHeight > node.clientHeight + 8
        ) {
          return node
        }
        node = node.parentElement
      }
      return null
    }

    /**
     * Keep the spoken sentence in view while follow mode is on. The sentence
     * sits in the upper third of the pane, and scrolling only happens when it
     * leaves the comfortable band, so the pane turns a page rather than
     * creeping line by line.
     */
    function followSpeakPosition() {
      const span = document.querySelector(`[${HL_ATTR}]`)
      if (!(span instanceof Element)) return false
      const container = scrollContainerOf(span)
      const rect = span.getBoundingClientRect()
      const view =
        container === null
          ? { top: 0, bottom: window.innerHeight, height: window.innerHeight }
          : container.getBoundingClientRect()
      if (view.height <= 0) return false
      const bottomLimit = view.bottom - Math.max(56, view.height * 0.22)
      const below = rect.bottom > bottomLimit
      const above = rect.top < view.top + 8
      if (!below && !above) return false
      const delta = rect.top - view.top - view.height / 3
      if (container === null) {
        window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' })
      } else {
        container.scrollTo({
          top: Math.max(0, container.scrollTop + delta),
          behavior: 'smooth',
        })
      }
      return true
    }

    // ------------------------------------------------------------------
    // Sidebar document previews
    // ------------------------------------------------------------------
    const SIDEBAR_CONTENT_SELECTOR = '[data-textpreview-content]'
    const SIDEBAR_DOC_SELECTOR =
      '[data-document-markdown], [data-textpreview-plain], [data-pdf-preview]'

    function sidebarPreviewFor(el) {
      return el instanceof Element ? el.closest(SIDEBAR_CONTENT_SELECTOR) : null
    }

    function sidebarDocumentFor(preview) {
      if (!(preview instanceof Element)) return null
      return preview.querySelector(SIDEBAR_DOC_SELECTOR)
    }

    let clickGuard = null
    function clearClickGuard() {
      if (clickGuard === null) return
      window.removeEventListener('click', clickGuard.handler, true)
      window.clearTimeout(clickGuard.timer)
      clickGuard = null
    }

    // A pointerdown must not turn into an activating click on a link, button,
    // or message action underneath the text we just picked.
    function blockNextClick() {
      clearClickGuard()
      const handler = (event) => {
        clearClickGuard()
        event.preventDefault()
        event.stopPropagation()
      }
      const timer = window.setTimeout(clearClickGuard, 700)
      clickGuard = { handler, timer }
      window.addEventListener('click', handler, true)
    }

    function SpeechControls(props) {
      const [data, setData] = useState(null)
      const [busy, setBusy] = useState(false)
      const [failed, setFailed] = useState(false)
      const [picking, setPicking] = useState(false)
      const controlsRef = useRef(null)

      useEffect(() => {
        let live = true
        let timer = 0
        const schedule = (next) => {
          window.clearTimeout(timer)
          const active = next?.status === 'speaking' || next?.status === 'paused'
          timer = window.setTimeout(load, active ? 700 : 1500)
        }
        const load = () => {
          request('status')
            .then((next) => {
              if (!live) return
              setData(next)
              setFailed(false)
              schedule(next)
            })
            .catch(() => {
              if (!live) return
              setFailed(true)
              schedule(null)
            })
        }
        load()
        return () => {
          live = false
          window.clearTimeout(timer)
        }
      }, [])

      const [browserStatus, setBrowserStatus] = useState('idle')
      const [browserText, setBrowserText] = useState('')
      const [browserSpeed, setBrowserSpeed] = useState(1)
      const [browserAuto, setBrowserAuto] = useState(false)
      const browserRef = useRef({
        session: 0,
        chunks: [],
        index: 0,
        raw: '',
        kind: 'reply',
        status: 'idle',
        speed: 1,
        utterance: null,
        root: null,
        cursor: 0,
        chunkStart: 0,
        highlightIndex: -1,
      })
      const browserVoices = useRef([])
      const browserSpeakRef = useRef(() => {})
      const browserModeRef = useRef(false)
      const browserAutoRef = useRef(false)
      const lastAutoRef = useRef('')
      const [follow, setFollow] = useState(false)
      const followRef = useRef(false)
      const hostSourceRef = useRef(null)
      // The source of the last pick, kept after playback ends so ↻ can read
      // the same sidebar document or paragraph again.
      const pickerSourceRef = useRef(null)

      const setFollowState = (next) => {
        followRef.current = next
        setFollow(next)
      }

      const toggleFollow = () => {
        const next = !followRef.current
        setFollowState(next)
        if (next) revealSpeechHighlight()
      }

      useEffect(() => {
        if (!('speechSynthesis' in window)) return
        const load = () => {
          browserVoices.current = window.speechSynthesis.getVoices()
        }
        load()
        window.speechSynthesis.addEventListener?.('voiceschanged', load)
        return () => {
          window.speechSynthesis.removeEventListener?.('voiceschanged', load)
          window.speechSynthesis.cancel()
        }
      }, [])

      const speakBrowserChunk = (session) => {
        const current = browserRef.current
        if (session !== current.session || current.status !== 'speaking') return
        if (current.index >= current.chunks.length) {
          current.status = 'idle'
          setBrowserStatus('idle')
          clearSpeechHighlight()
          setFollowState(false)
          return
        }
        const chunk = current.chunks[current.index]
        if (current.index !== current.highlightIndex) {
          current.highlightIndex = current.index
          current.chunkStart = current.cursor
        }
        if (current.root instanceof Element && current.root.isConnected) {
          current.cursor = highlightSpeechChunk(current.root, chunk, current.chunkStart)
          if (followRef.current) followSpeakPosition()
        } else {
          clearSpeechHighlight()
        }
        const utterance = new window.SpeechSynthesisUtterance(chunk)
        utterance.rate = current.speed
        const voice = pickBrowserVoice(chunk, browserVoices.current)
        if (voice) {
          utterance.voice = voice
          utterance.lang = voice.lang
        } else {
          utterance.lang = /[\u3400-\u9fff]/.test(chunk) ? 'zh-HK' : 'en-US'
        }
        utterance.onend = () => {
          if (session !== current.session || current.status !== 'speaking') return
          current.index += 1
          speakBrowserChunk(session)
        }
        utterance.onerror = () => {
          if (session !== current.session) return
          current.status = 'idle'
          setBrowserStatus('idle')
          clearSpeechHighlight()
          setFollowState(false)
        }
        current.utterance = utterance
        window.speechSynthesis.speak(utterance)
      }

      const speakBrowser = (raw, kind = 'reply', sourceEl = null) => {
        if (
          !('speechSynthesis' in window) ||
          typeof window.SpeechSynthesisUtterance !== 'function'
        ) {
          setFailed(true)
          return
        }
        const cleaned =
          kind === 'selection' ? browserCleanSelection(raw) : browserCleanReply(raw)
        const chunks = splitBrowserChunks(cleaned)
        if (chunks.length === 0) return
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Some browsers throw when there is no active utterance.
        }
        clearSpeechHighlight()
        setFollowState(false)
        const current = browserRef.current
        current.session += 1
        current.chunks = chunks
        current.index = 0
        current.raw = raw
        current.kind = kind
        current.status = 'speaking'
        current.speed = Number(browserSpeed) || 1
        current.root = sourceEl instanceof Element ? sourceEl : null
        current.cursor = 0
        current.chunkStart = 0
        current.highlightIndex = -1
        lastAutoRef.current = cleaned
        setBrowserText(cleaned)
        setBrowserStatus('speaking')
        setFailed(false)
        speakBrowserChunk(current.session)
      }
      browserSpeakRef.current = speakBrowser

      const pauseBrowser = () => {
        const current = browserRef.current
        if (current.status !== 'speaking') return
        current.session += 1
        current.status = 'paused'
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Ignore an already-finished utterance.
        }
        setBrowserStatus('paused')
      }

      const resumeBrowser = () => {
        const current = browserRef.current
        if (current.status !== 'paused') return
        current.status = 'speaking'
        current.session += 1
        setBrowserStatus('speaking')
        speakBrowserChunk(current.session)
      }

      const stopBrowser = () => {
        const current = browserRef.current
        current.session += 1
        current.status = 'idle'
        current.chunks = []
        current.index = 0
        current.raw = ''
        current.kind = 'reply'
        current.root = null
        current.cursor = 0
        current.chunkStart = 0
        current.highlightIndex = -1
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Ignore.
        }
        clearSpeechHighlight()
        setFollowState(false)
        setBrowserText('')
        setBrowserStatus('idle')
      }

      const replayBrowser = () => {
        const current = browserRef.current
        if (current.raw === '') return
        speakBrowser(current.raw, current.kind, current.root)
      }

      const setBrowserRate = (value) => {
        const next = Number(value) || 1
        setBrowserSpeed(next)
        const current = browserRef.current
        current.speed = next
        if (current.status === 'speaking') {
          current.session += 1
          try {
            window.speechSynthesis.cancel()
          } catch {
            // Ignore.
          }
          current.status = 'speaking'
          speakBrowserChunk(current.session)
        }
      }

      const toggleBrowserAuto = () => {
        const next = !browserAutoRef.current
        browserAutoRef.current = next
        setBrowserAuto(next)
        try {
          window.localStorage.setItem('dsh-browser-auto', next ? 'on' : 'off')
        } catch {
          // Private browsing can block localStorage.
        }
        if (next) {
          lastAutoRef.current = browserCleanReply(latestAssistantText())
          speakBrowser('自動朗讀已開啟', 'reply')
        }
      }

      useEffect(() => {
        browserAutoRef.current = browserAuto
      }, [browserAuto])

      useEffect(() => {
        if (data?.mode !== 'browser' || !browserAuto) return
        const flow =
          document.querySelector('[data-chat-flow]') ||
          document.querySelector('[data-chat-node-key]')?.parentElement ||
          document.body
        if (flow === null) return
        let timer = 0
        let candidate = browserCleanReply(latestAssistantText())
        let disposed = false

        const schedule = (delay) => {
          window.clearTimeout(timer)
          timer = window.setTimeout(check, delay)
        }

        const check = () => {
          if (disposed || !browserAutoRef.current) return
          if (document.querySelector('[data-chat-running]') !== null) {
            schedule(800)
            return
          }
          if (browserRef.current.status !== 'idle') {
            schedule(800)
            return
          }
          const node = latestAssistantNode()
          const raw = node?.text ?? ''
          const text = browserCleanReply(raw)
          if (text === '') return
          if (text !== candidate) {
            candidate = text
            schedule(700)
            return
          }
          if (text === lastAutoRef.current) return
          lastAutoRef.current = text
          browserSpeakRef.current(raw, 'reply', node?.element ?? null)
        }

        const observer = new MutationObserver(() => schedule(1000))
        observer.observe(flow, { childList: true, subtree: true, characterData: true })
        return () => {
          disposed = true
          observer.disconnect()
          window.clearTimeout(timer)
        }
      }, [data?.mode, browserAuto])

      // Desktop (host) playback chunks inside the main process; the status
      // snapshot exposes the chunk currently being spoken so the renderer can
      // mark the same sentence in the conversation.
      const hostHighlightRef = useRef({ chunk: 0, text: '', cursor: 0 })
      const playbackStatusRef = useRef('idle')
      const playbackChunkRef = useRef(0)

      // A new reading always starts with follow off; pausing keeps it.
      useEffect(() => {
        if (data?.mode !== 'host') return
        const next = data?.status ?? 'idle'
        const previous = playbackStatusRef.current
        const chunkNumber = Number(data?.chunk) || 0
        const previousChunk = playbackChunkRef.current
        if (next === 'idle') {
          if (previous !== 'idle') {
            setFollowState(false)
            // Only drop the picked source when a reading actually ended; an
            // idle poll must not clear a pick that is still being started.
            hostSourceRef.current = null
          }
        } else if (previous === 'idle' || (chunkNumber === 1 && previousChunk !== 1)) {
          setFollowState(false)
          if (data?.source === 'reply') {
            // A reply read owns the conversation again.
            hostSourceRef.current = null
            pickerSourceRef.current = null
          }
        }
        playbackStatusRef.current = next
        playbackChunkRef.current = chunkNumber
      }, [data?.mode, data?.status, data?.chunk])

      useEffect(() => {
        if (data?.mode !== 'host') return
        const live = data?.status === 'speaking' || data?.status === 'paused'
        const text = typeof data?.currentText === 'string' ? data.currentText : ''
        const state = hostHighlightRef.current
        if (!live || text === '') {
          if (state.text !== '') {
            clearSpeechHighlight()
            state.text = ''
            state.cursor = 0
          }
          return
        }
        const chunkNumber = Number(data?.chunk) || 0
        if (chunkNumber !== state.chunk) {
          state.chunk = chunkNumber
          if (chunkNumber <= 1) state.cursor = 0
        }
        if (state.text === text) return
        const stored =
          hostSourceRef.current instanceof Element && hostSourceRef.current.isConnected
            ? hostSourceRef.current
            : null
        const root = stored ?? latestAssistantNode()?.element ?? null
        state.text = text
        state.cursor = root === null ? 0 : highlightSpeechChunk(root, text, state.cursor)
        if (followRef.current) followSpeakPosition()
      }, [data?.mode, data?.status, data?.currentText, data?.chunk])

      useEffect(
        () => () => {
          clearSpeechHighlight()
        },
        [],
      )

      useEffect(() => {
        if (!picking) return

        const root = document.documentElement
        const previousCursor = root.style.cursor
        const previousUserSelect = root.style.userSelect
        const previousWebkitUserSelect = root.style.webkitUserSelect
        root.classList.add('dsh-speech-picking')
        root.style.cursor = 'crosshair'
        root.style.userSelect = 'none'
        root.style.webkitUserSelect = 'none'

        let hovered = null
        let savedHover = null
        let raf = 0
        let lastX = 0
        let lastY = 0

        const clearHover = () => {
          if (hovered !== null && savedHover !== null) {
            hovered.style.outline = savedHover.outline
            hovered.style.outlineOffset = savedHover.outlineOffset
            hovered.style.backgroundColor = savedHover.backgroundColor
            hovered.style.borderRadius = savedHover.borderRadius
          }
          hovered = null
          savedHover = null
        }

        const highlight = (el) => {
          if (el === hovered) return
          clearHover()
          if (el === null) return
          hovered = el
          savedHover = {
            outline: el.style.outline,
            outlineOffset: el.style.outlineOffset,
            backgroundColor: el.style.backgroundColor,
            borderRadius: el.style.borderRadius,
          }
          el.style.outline = '2px solid var(--dsw-alias-brand-primary)'
          el.style.outlineOffset = '2px'
          el.style.borderRadius = '6px'
          el.style.backgroundColor =
            'color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent)'
        }

        const updateHover = () => {
          raf = 0
          const target = document.elementFromPoint(lastX, lastY)
          if (
            target === null ||
            (controlsRef.current !== null && controlsRef.current.contains(target))
          ) {
            clearHover()
            return
          }
          highlight(findTextContainer(target))
        }

        const onMove = (event) => {
          lastX = event.clientX
          lastY = event.clientY
          if (raf !== 0) return
          raf = window.requestAnimationFrame(updateHover)
        }

        const onDown = (event) => {
          if (event.button !== 0) return
          const target = event.target
          if (!(target instanceof Element)) return

          if (controlsRef.current !== null && controlsRef.current.contains(target)) {
            // Let the pick button's own click toggle the mode. Any other
            // control exits picking before performing its normal action.
            if (target.closest('[data-speech-pick]') === null) setPicking(false)
            return
          }

          const container = findTextContainer(target)
          if (container === null) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          const pdfSection = container.closest('[data-pdf-preview]')
          const text = pdfSection === null ? readableText(container) : ''
          if (pdfSection === null && text === '') {
            event.preventDefault()
            event.stopPropagation()
            return
          }

          event.preventDefault()
          event.stopPropagation()
          blockNextClick()
          clearHover()
          setPicking(false)

          if (pdfSection !== null) {
            setBusy(true)
            collectPdfText(container)
              .then((pdfText) => {
                if (pdfText === '') return undefined
                if (browserModeRef.current) {
                  browserSpeakRef.current(pdfText, 'selection', pdfSection)
                  return undefined
                }
                hostSourceRef.current = pdfSection
                pickerSourceRef.current = pdfSection
                return request('speak', undefined, { text: pdfText }).then((next) => {
                  setData(next)
                  setFailed(false)
                })
              })
              .catch(() => setFailed(true))
              .finally(() => setBusy(false))
            return
          }

          if (browserModeRef.current) {
            browserSpeakRef.current(text, 'selection', container)
            return
          }
          hostSourceRef.current = container
          pickerSourceRef.current = container
          setBusy(true)
          request('speak', undefined, { text })
            .then((next) => {
              setData(next)
              setFailed(false)
            })
            .catch(() => setFailed(true))
            .finally(() => setBusy(false))
        }

        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setPicking(false)
          }
        }

        const onContext = (event) => {
          event.preventDefault()
          event.stopPropagation()
          setPicking(false)
        }

        const onScroll = () => clearHover()
        const onBlur = () => setPicking(false)

        document.addEventListener('pointermove', onMove, true)
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        document.addEventListener('contextmenu', onContext, true)
        document.addEventListener('scroll', onScroll, true)
        window.addEventListener('blur', onBlur)

        return () => {
          if (raf !== 0) window.cancelAnimationFrame(raf)
          document.removeEventListener('pointermove', onMove, true)
          document.removeEventListener('pointerdown', onDown, true)
          document.removeEventListener('keydown', onKey, true)
          document.removeEventListener('contextmenu', onContext, true)
          document.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('blur', onBlur)
          clearHover()
          root.classList.remove('dsh-speech-picking')
          root.style.cursor = previousCursor
          root.style.userSelect = previousUserSelect
          root.style.webkitUserSelect = previousWebkitUserSelect
        }
      }, [picking])

      const act = async (action, value, body) => {
        if (busy) return
        setBusy(true)
        try {
          const next = await request(action, value, body)
          setData(next)
          setFailed(false)
        } catch {
          setFailed(true)
        } finally {
          setBusy(false)
        }
      }

      const sessionId =
        typeof props?.sessionId === 'string' ? props.sessionId : undefined
      const browserMode = data?.mode === 'browser'
      browserModeRef.current = browserMode
      const status = browserMode ? browserStatus : (data?.status ?? 'idle')
      const speed = browserMode ? browserSpeed : (data?.speed ?? 1)
      const canReplay = browserMode ? browserText !== '' : data?.canReplay === true
      const hasLatest = data?.hasLatest === true
      const autoRead = data?.enabled === true
      const paused = status === 'paused'
      const playing = status === 'speaking'
      const active = status !== 'idle'

      const speaker = browserMode
        ? h(
            'button',
            {
              key: 'speaker',
              type: 'button',
              onClick: () => {
                setPicking(false)
                if (active) stopBrowser()
                else toggleBrowserAuto()
              },
              disabled: busy,
              'aria-pressed': active ? undefined : browserAuto,
              'aria-label': active
                ? '停止此裝置朗讀'
                : browserAuto
                  ? '關閉此裝置自動朗讀'
                  : '開啟此裝置自動朗讀',
              title: active
                ? '停止此裝置朗讀'
                : browserAuto
                  ? '此裝置自動朗讀：開（點擊關閉）'
                  : '此裝置自動朗讀：關（點擊開啟）',
              style: {
                ...iconStyle(busy),
                color:
                  active || browserAuto
                    ? 'var(--dsw-alias-label-primary)'
                    : 'var(--dsw-alias-label-secondary)',
              },
            },
            active ? stopIcon() : speakerIcon(browserAuto),
          )
        : h(
            'button',
            {
              key: 'speaker',
              type: 'button',
              onClick: () => {
                setPicking(false)
                hostSourceRef.current = null
                pickerSourceRef.current = null
                act(active ? 'stop' : 'toggle')
              },
              disabled: busy,
              'aria-pressed': active ? undefined : autoRead,
              'aria-label': active
                ? '停止所有朗讀並重設'
                : autoRead
                  ? '關閉自動朗讀'
                  : '開啟自動朗讀',
              title: active
                ? '停止所有朗讀並重設'
                : autoRead
                  ? '自動朗讀：開（點擊關閉）'
                  : '自動朗讀：關（點擊開啟）',
              style: {
                ...iconStyle(busy),
                color:
                  active || autoRead
                    ? 'var(--dsw-alias-label-primary)'
                    : 'var(--dsw-alias-label-secondary)',
              },
            },
            active ? stopIcon() : speakerIcon(autoRead),
          )

      const playDisabled = browserMode
        ? busy
        : busy || (!playing && !paused && !hasLatest)
      const pause = h(
        'button',
        {
          key: 'pause',
          type: 'button',
          onClick: () => {
            if (playing) {
              if (browserMode) pauseBrowser()
              else act('pause')
            } else if (paused) {
              if (browserMode) resumeBrowser()
              else act('resume')
            } else if (browserMode) {
              const node = latestAssistantNode()
              if (node !== null) speakBrowser(node.text, 'reply', node.element)
            } else {
              hostSourceRef.current = null
              pickerSourceRef.current = null
              setFollowState(false)
              act('play', undefined, sessionId === undefined ? {} : { sessionId })
            }
          },
          disabled: playDisabled,
          'aria-label': playing
            ? '暫停朗讀'
            : paused
              ? '繼續朗讀'
              : browserMode
                ? '用此裝置播放最新回覆'
                : '播放最新回覆',
          title: playing
            ? '暫停朗讀'
            : paused
              ? '繼續朗讀目前內容'
              : browserMode
                ? '用此裝置讀最新回覆（Web Speech）'
                : hasLatest
                  ? '播放最新回覆'
                  : '暫時沒有可播放的回覆',
          style: iconStyle(playDisabled),
        },
        playing ? '⏸' : '▶',
      )

      const replay = h(
        'button',
        {
          key: 'replay',
          type: 'button',
          onClick: () => {
            if (browserMode) replayBrowser()
            else {
              const selection = data?.source === 'selection'
              hostSourceRef.current = selection ? pickerSourceRef.current : null
              if (!selection) pickerSourceRef.current = null
              setFollowState(false)
              act('replay')
            }
          },
          disabled: busy || !canReplay,
          'aria-label': '由頭重讀目前文字',
          title: canReplay
            ? browserMode
              ? '由頭重讀目前文字'
              : data?.truncated
                ? '由頭重讀（原文字太長，只讀首 8,000 字）'
                : '由頭重讀目前文字'
            : '暫時沒有可重讀的文字',
          style: iconStyle(busy || !canReplay),
        },
        '↻',
      )

      const locateDisabled = busy || !active
      const locate = h(
        'button',
        {
          key: 'locate',
          type: 'button',
          onClick: () => {
            if (active) toggleFollow()
          },
          disabled: locateDisabled,
          'aria-pressed': follow,
          'aria-label': follow
            ? '取消跟隨朗讀位置及自動翻頁'
            : '跳去朗讀位置並跟隨自動翻頁',
          title: locateDisabled
            ? '開始朗讀後可以跟隨朗讀位置'
            : follow
              ? '跟隨朗讀：開（點擊取消跟隨及自動翻頁）'
              : '跟隨朗讀：關（點擊跳去朗讀位置並開啟自動翻頁）',
          style: {
            ...iconStyle(locateDisabled),
            color: follow ? HL_COLOR : 'var(--dsw-alias-label-primary)',
          },
        },
        followIcon(),
      )

      const rate = h(
        'select',
        {
          key: 'speed',
          value: String(speed),
          onChange: (event) => {
            if (browserMode) setBrowserRate(event.target.value)
            else act('speed', event.target.value)
          },
          disabled: busy && !browserMode,
          'aria-label': '朗讀速度',
          title: '朗讀速度：0.8 倍、1 倍、1.25 倍或 1.5 倍',
          style: {
            height: 28,
            padding: '0 4px',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: 7,
            background: 'var(--dsw-alias-bg-layer-1)',
            color: 'var(--dsw-alias-label-secondary)',
            font: 'inherit',
            fontSize: 12,
            lineHeight: 1,
            cursor: busy && !browserMode ? 'progress' : 'pointer',
          },
        },
        ...[
          ['0.8', '0.8×'],
          ['1', '1×'],
          ['1.25', '1.25×'],
          ['1.5', '1.5×'],
        ].map(([value, label]) => h('option', { key: value, value }, label)),
      )

      const pick = h(
        'button',
        {
          key: 'pick',
          type: 'button',
          onClick: () => setPicking((current) => !current),
          disabled: busy,
          'aria-pressed': picking,
          'aria-label': picking ? '取消選取文字朗讀' : '選取文字朗讀',
          title: picking ? '點一下文字朗讀（Esc 取消）' : '選取文字朗讀',
          'data-speech-pick': '',
          className: picking ? 'dsh-speech-pick' : undefined,
          style: {
            ...iconStyle(busy),
            color: picking
              ? 'var(--dsw-alias-brand-primary)'
              : 'var(--dsw-alias-label-secondary)',
          },
        },
        pointerHandIcon(),
      )

      return h(
        React.Fragment,
        null,
        h('style', { key: 'pulse-style' }, PULSE_CSS),
        h(
          'span',
          {
            ref: controlsRef,
            'data-speech-controls': '',
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'nowrap',
              opacity: failed ? 0.65 : 1,
            },
          },
          speaker,
          pause,
          replay,
          locate,
          rate,
          pick,
          picking
            ? h(
                'span',
                {
                  key: 'pick-hint',
                  style: {
                    marginLeft: 2,
                    color: 'var(--dsw-alias-label-secondary)',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                  },
                },
                '點文字 · Esc 取消',
              )
            : null,
          h(
            'span',
            {
              key: 'live',
              role: 'status',
              'aria-live': 'polite',
              style: {
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
                border: 0,
              },
            },
            picking ? '選取文字模式：點一下想朗讀的文字，按 Esc 取消' : '',
          ),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'cantonese-speech-toggle',
              order: 20,
            },
            SpeechControls,
          ),
        )
      },
    }
  },
})
