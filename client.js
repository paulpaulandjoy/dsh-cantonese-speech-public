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

    function latestAssistantText() {
      for (const selector of LATEST_SELECTORS) {
        const nodes = Array.from(document.querySelectorAll(selector)).filter(
          (el) => el instanceof HTMLElement && elementText(el) !== '',
        )
        if (nodes.length > 0) return elementText(nodes[nodes.length - 1])
      }
      return ''
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
        const load = () => {
          request('status')
            .then((next) => {
              if (!live) return
              setData(next)
              setFailed(false)
            })
            .catch(() => {
              if (live) setFailed(true)
            })
        }
        load()
        const timer = setInterval(load, 1200)
        return () => {
          live = false
          clearInterval(timer)
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
      })
      const browserVoices = useRef([])
      const browserSpeakRef = useRef(() => {})
      const browserModeRef = useRef(false)
      const browserAutoRef = useRef(false)
      const lastAutoRef = useRef('')

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
          return
        }
        const chunk = current.chunks[current.index]
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
        }
        current.utterance = utterance
        window.speechSynthesis.speak(utterance)
      }

      const speakBrowser = (raw, kind = 'reply') => {
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
        const current = browserRef.current
        current.session += 1
        current.chunks = chunks
        current.index = 0
        current.raw = raw
        current.kind = kind
        current.status = 'speaking'
        current.speed = Number(browserSpeed) || 1
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
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Ignore.
        }
        setBrowserText('')
        setBrowserStatus('idle')
      }

      const replayBrowser = () => {
        const current = browserRef.current
        if (current.raw === '') return
        speakBrowser(current.raw, current.kind)
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
          const raw = latestAssistantText()
          const text = browserCleanReply(raw)
          if (text === '') return
          if (text !== candidate) {
            candidate = text
            schedule(700)
            return
          }
          if (text === lastAutoRef.current) return
          lastAutoRef.current = text
          browserSpeakRef.current(raw, 'reply')
        }

        const observer = new MutationObserver(() => schedule(1000))
        observer.observe(flow, { childList: true, subtree: true, characterData: true })
        return () => {
          disposed = true
          observer.disconnect()
          window.clearTimeout(timer)
        }
      }, [data?.mode, browserAuto])

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
          const text = container === null ? '' : extractText(container)
          if (container === null || text === '') {
            event.preventDefault()
            event.stopPropagation()
            return
          }

          event.preventDefault()
          event.stopPropagation()
          blockNextClick()
          clearHover()
          setPicking(false)
          if (browserModeRef.current) {
            browserSpeakRef.current(text, 'selection')
            return
          }
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
              const text = latestAssistantText()
              if (text !== '') speakBrowser(text, 'reply')
            } else {
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
            else act('replay')
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
