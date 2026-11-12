/**
 * Host half of Cantonese speech replies.
 *
 * Two sources feed the same local playback pipeline:
 *   - automatic reading of one completed assistant reply per turn;
 *   - on-demand reading of text selected in the DSH page.
 *
 * Playback is chunked by sentence so pause, resume, replay, and speed changes
 * stay responsive without an audio file or model request.
 */
import { spawn } from 'node:child_process'

export const inject = ['webServer']

const CANTONESE_VOICE = 'Sinji'
const ENGLISH_VOICE = 'Samantha'
const BASE_RATE = 185
const MAX_CHARS = 8000
const MAX_CHUNK = 55
const MAX_BODY_BYTES = 128000
const SPEEDS = new Set([0.8, 1, 1.25, 1.5])
const ROUTE = '/local-speech'
const SAY = process.env.DSH_SPEECH_SAY ?? '/usr/bin/say'
let browserMode = process.env.DSH_PROFILE === 'web'
let webServer = null

function isLoopbackOrigin(origin) {
  return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::|\/|$)/.test(origin)
}

function isBrowserMode() {
  if (process.env.DSH_PROFILE === 'web') return true
  if (webServer !== null) {
    try {
      return !isLoopbackOrigin(webServer.getOrigin())
    } catch {
      // The server may not have bound its port yet.
    }
  }
  return browserMode
}

let autoRead = true
let speed = 1
let status = 'idle' // idle | speaking | paused
let chunks = []
let chunkIndex = 0
let lastText = ''
let lastKind = 'reply' // reply | selection
let lastTruncated = false
let speaking = null
const latestReply = new Map()
let lastSessionId = null

function stopProcess() {
  if (speaking === null) return
  const child = speaking
  speaking = null
  try {
    child.kill('SIGTERM')
  } catch {
    // The process may already have exited.
  }
}

function resetPlayback() {
  stopProcess()
  status = 'idle'
  chunks = []
  chunkIndex = 0
}

function limit(text) {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text
}

/** Turn Markdown from an assistant reply into natural-sounding speech. */
export function speechText(raw) {
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
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

/**
 * Clean text already rendered in the page. Code is kept; URLs are skipped.
 * Markdown syntax is not stripped because the DOM text no longer has it.
 */
export function selectionText(raw) {
  let text = String(raw ?? '').replace(/\r\n?/g, '\n')
  text = text.replace(/<https?:\/\/[^>]*>/g, ' ')
  text = text.replace(/https?:\/\/\S+/g, ' ')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/ *\n */g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

/** Cantonese when Han characters dominate; otherwise English. */
export function voiceFor(text) {
  const han = (text.match(/[\u3400-\u9fff]/g) ?? []).length
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  return han > 0 && han >= latin ? CANTONESE_VOICE : ENGLISH_VOICE
}

function hardSplit(text, size) {
  const parts = []
  let rest = text
  while (rest.length > size) {
    let cut = rest.lastIndexOf(' ', size)
    if (cut < Math.floor(size / 2)) cut = size
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest !== '') parts.push(rest)
  return parts
}

function splitLong(sentence) {
  if (sentence.length <= MAX_CHUNK) return [sentence]
  const parts = sentence.split(/(?<=[，、：,:])\s*/)
  const chunks = []
  let current = ''
  for (const part of parts) {
    if (current !== '' && current.length + part.length > MAX_CHUNK) {
      chunks.push(current.trim())
      current = part
    } else {
      current += part
    }
  }
  if (current.trim() !== '') chunks.push(current.trim())
  return chunks.flatMap((chunk) =>
    chunk.length <= MAX_CHUNK ? [chunk] : hardSplit(chunk, MAX_CHUNK),
  )
}

/** Split at sentence boundaries, keeping each spoken chunk short. */
export function splitChunks(text) {
  const result = []
  for (const paragraph of String(text ?? '').split(/\n+/)) {
    const sentences = paragraph
      .split(/(?<=[。！？；!?;])\s*|(?<=\.)\s+/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence !== '')
    for (const sentence of sentences) {
      result.push(...splitLong(sentence))
    }
  }
  return result.filter((chunk) => chunk !== '')
}

function speakCurrent() {
  if (status !== 'speaking') return
  if (chunkIndex >= chunks.length) {
    status = 'idle'
    chunks = []
    chunkIndex = 0
    return
  }

  const chunk = chunks[chunkIndex]
  const child = spawn(
    SAY,
    ['-v', voiceFor(chunk), '-r', String(Math.round(BASE_RATE * speed))],
    { stdio: ['pipe', 'ignore', 'ignore'] },
  )
  speaking = child
  child.on('error', () => {
    if (speaking !== child) return
    speaking = null
    status = 'idle'
  })
  child.on('exit', () => {
    if (speaking !== child) return
    speaking = null
    if (status !== 'speaking') return
    chunkIndex += 1
    speakCurrent()
  })
  child.stdin.on('error', () => {
    // A killed `say` may close stdin early.
  })
  child.stdin.end(chunk)
}

function playFromStart(text, kind) {
  const clean =
    kind === 'selection' ? limit(selectionText(text)) : limit(speechText(text))
  if (clean === '') return false
  const next = splitChunks(clean)
  if (next.length === 0) return false

  stopProcess()
  lastText = clean
  lastKind = kind
  lastTruncated = clean.length >= MAX_CHARS
  chunks = next
  chunkIndex = 0
  status = 'speaking'
  speakCurrent()
  return true
}

function playSelection(text) {
  if (isBrowserMode()) return false
  if (selectionText(text).trim() === '') return false
  return playFromStart(text, 'selection')
}

function pause() {
  if (status !== 'speaking') return
  status = 'paused'
  stopProcess()
}

function resume() {
  if (status !== 'paused') return
  status = 'speaking'
  speakCurrent()
}

function replay() {
  if (isBrowserMode() || lastText === '') return
  playFromStart(lastText, lastKind)
}

function setSpeed(value) {
  const next = Number(value)
  if (!SPEEDS.has(next)) return false
  speed = next
  if (status === 'speaking') {
    stopProcess()
    speakCurrent()
  }
  return true
}

function stopAll() {
  resetPlayback()
  lastText = ''
  lastKind = 'reply'
  lastTruncated = false
}

function playLatest(sessionId) {
  if (isBrowserMode()) return false
  const text =
    typeof sessionId === 'string'
      ? latestReply.get(sessionId)
      : lastSessionId === null
        ? undefined
        : latestReply.get(lastSessionId)
  if (typeof text !== 'string' || text === '') {
    resetPlayback()
    lastText = ''
    lastKind = 'reply'
    lastTruncated = false
    return false
  }
  const started = playFromStart(text, 'reply')
  if (!started) {
    resetPlayback()
    lastText = ''
    lastKind = 'reply'
    lastTruncated = false
  }
  return started
}

function snapshot() {
  return {
    ok: true,
    mode: isBrowserMode() ? 'browser' : 'host',
    enabled: autoRead,
    status,
    speed,
    source: lastKind,
    canReplay: lastText !== '',
    hasLatest: lastSessionId !== null && latestReply.has(lastSessionId),
    truncated: lastTruncated,
    chunk: chunks.length === 0 ? 0 : Math.min(chunkIndex + 1, chunks.length),
    chunks: chunks.length,
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const parts = []
    let size = 0
    let tooLarge = false
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        tooLarge = true
        return
      }
      parts.push(chunk)
    })
    req.on('end', () => {
      if (tooLarge) {
        reject(new Error('Request body is too large'))
        return
      }
      const raw = Buffer.concat(parts).toString('utf8').trim()
      if (raw === '') {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function json(res, statusCode, value) {
  const body = JSON.stringify(value)
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  res.end(body)
}

function assistantText(message) {
  const content = Array.isArray(message?.content) ? message.content : []
  return content
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n\n')
}

function speakTurn(raw) {
  if (isBrowserMode()) return
  if (!autoRead) return
  // A manual selection keeps the floor until it finishes or is stopped.
  if (lastKind === 'selection' && status !== 'idle') return
  playFromStart(raw, 'reply')
}

export function apply(ctx) {
  webServer = ctx.webServer
  browserMode = isBrowserMode()
  const pending = new Map()

  ctx.on('session/event', (session, event) => {
    if (session.header.origin === 'subagent') return

    if (event.type === 'assistant/message') {
      const text = assistantText(event.data.message)
      if (text !== '') pending.set(session.id, text)
      return
    }

    if (event.type === 'turn/end') {
      const text = pending.get(session.id)
      pending.delete(session.id)
      if (event.data.reason.kind === 'completed' && text !== undefined) {
        latestReply.set(session.id, text)
        lastSessionId = session.id
        speakTurn(text)
      }
      return
    }

    if (event.type === 'user/message') {
      // A new user turn interrupts the previous reply instead of talking over it.
      pending.delete(session.id)
      resetPlayback()
      lastText = ''
      lastKind = 'reply'
      lastTruncated = false
    }
  })

  ctx.on('session/disposed', (session) => {
    pending.delete(session.id)
    latestReply.delete(session.id)
    if (lastSessionId === session.id) lastSessionId = null
  })

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: async (req, res) => {
        const url = new URL(req.url ?? ROUTE, 'http://localhost')
        if (url.pathname !== ROUTE) {
          json(res, 404, { ok: false, error: 'Not found' })
          return
        }

        // Same-origin browser calls only. A local process without an Origin
        // header is still accepted for diagnostics.
        const origin = req.headers?.origin
        if (typeof origin === 'string') {
          try {
            if (origin === 'null' || new URL(origin).host !== req.headers?.host) {
              json(res, 403, { ok: false, error: 'Cross-origin request refused' })
              return
            }
          } catch {
            json(res, 403, { ok: false, error: 'Invalid Origin' })
            return
          }
        }
        const method = req.method ?? 'GET'
        const action = url.searchParams.get('action') ?? 'status'

        if (method === 'GET' && action === 'status') {
          json(res, 200, snapshot())
          return
        }
        if (method !== 'POST') {
          json(res, 405, { ok: false, error: 'Use GET status or POST actions' })
          return
        }

        if (action === 'stop') {
          stopAll()
          json(res, 200, snapshot())
          return
        }
        if (action === 'play') {
          let body = {}
          try {
            body = await readJson(req)
          } catch {
            json(res, 400, { ok: false, error: 'Invalid JSON body' })
            return
          }
          if (body?.sessionId !== undefined && typeof body.sessionId !== 'string') {
            json(res, 400, { ok: false, error: 'sessionId must be a string' })
            return
          }
          const spoke = playLatest(body?.sessionId)
          json(res, 200, { ...snapshot(), spoke })
          return
        }
        if (action === 'toggle') {
          if (status === 'idle') autoRead = !autoRead
          else stopAll()
          json(res, 200, snapshot())
          return
        }
        if (action === 'on') {
          autoRead = true
          json(res, 200, snapshot())
          return
        }
        if (action === 'off') {
          autoRead = false
          json(res, 200, snapshot())
          return
        }
        if (action === 'pause') {
          pause()
          json(res, 200, snapshot())
          return
        }
        if (action === 'resume') {
          resume()
          json(res, 200, snapshot())
          return
        }
        if (action === 'replay') {
          replay()
          json(res, 200, snapshot())
          return
        }
        if (action === 'speed') {
          if (!setSpeed(url.searchParams.get('value'))) {
            json(res, 400, { ok: false, error: 'Speed must be 0.8, 1, 1.25, or 1.5' })
            return
          }
          json(res, 200, snapshot())
          return
        }
        if (action === 'speak') {
          let body
          try {
            body = await readJson(req)
          } catch {
            json(res, 400, { ok: false, error: 'Invalid JSON body' })
            return
          }
          if (typeof body?.text !== 'string' || body.text.trim() === '') {
            json(res, 400, { ok: false, error: 'Text is required' })
            return
          }
          if (!playSelection(body.text)) {
            json(res, 400, { ok: false, error: 'Selected text is empty after cleanup' })
            return
          }
          json(res, 200, snapshot())
          return
        }
        json(res, 400, { ok: false, error: `Unknown action: ${action}` })
      },
    }),
  )

  ctx.effect(() => () => {
    pending.clear()
    resetPlayback()
  })
}
