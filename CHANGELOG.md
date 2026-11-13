# Changelog

## 1.4.0 — 2026-11-13

- Turned the locate button into a follow toggle with a down-arrow icon: black by default (no jump, no auto page-turn); pressing it turns red, jumps to the spoken sentence and follows it; pressing again stops following. Follow resets to off for every new reading.
- Extended reading to the Sidebar document preview: Markdown, plain text/code, PDF and Office (PDF-backed) files. Picking a block reads that section; picking blank space reads the whole document from the top.
- Markdown reading skips YAML frontmatter, so metadata is not read and the body keeps its normal size.
- PDF reading now walks the text layer page by page: reading continues past the end of a page and builds each page's text layer on demand (up to 8,000 characters).
- Fixed PDF characters being split or skipped: PDF.js positions every text span absolutely, so text is now read as continuous text instead of one fragment per span.
- Replay keeps the picked sidebar/paragraph source, so replaying selected text keeps its red underline.
- Excel, HTML previews and images have no readable text layer. Arbitrary external websites remain unsupported, for privacy.

## 1.3.0 — 2026-11-13

- Added a bold red underline beneath the sentence currently being spoken, so the reader can follow along without covering the text.
- Works in both Desktop (macOS `say`) and browser (Web Speech) modes; the underline leaves the glyphs untouched.
- Added a ⌖ locate button that scrolls straight back to the sentence being spoken after scrolling elsewhere.
- The underline clears on stop, finish or error and is restored if the conversation re-renders.

## 1.2.1 — 2026-11-12

- Hardened the `/local-speech` route: `status` stays read-only, while play/speak/stop/pause/resume/replay/speed are loopback-only.
- Remote browser TTS continues to work through the device's own speechSynthesis.
- Updated SECURITY.md and the guide.

## 1.2.0 — 2026-11-12

- Added automatic reading for Browser TTS on the web profile.
- Auto-read is off on each page load; tapping the speaker enables it and speaks a short confirmation to unlock browser speech.
- Speaker becomes a stop/reset control during playback.
- Manual Play, picking, pause/resume, replay and speed remain available.
- Updated the guide and README for browser auto-read.

## 1.1.0 — 2026-11-12

- Added Browser TTS (Web Speech API) mode for the web profile, with audio on the device that opens the page.
- Browser mode supports manual Play, text picking, pause/resume, replay and speed.
- Initial browser release intentionally has no automatic reading.
- Desktop profile continues to use macOS `say`.
- Updated the human guide and README for the web/browser mode.

## 1.0.3 — 2026-11-11

- Sanitized local macOS paths and account placeholders in the human guide.
- Added a plain-language warranty/liability disclaimer to README and the PDF guide.
- No plugin runtime changes.

## 1.0.2 — 2026-11-11

- Added the MIT License under the legal name Cheung Chi Sing.
- Updated the human guide, README, package metadata and release references for the MIT license.
- No plugin runtime changes.

## 1.0.1 — 2026-11-11

- Added a complete human-facing PDF and editable DOCX guide covering usage, GitHub, Keychain, AI collaboration, and manual fallback steps.
- No plugin runtime changes.

## 1.0.0 — 2026-11-11

- Initial DSH Desktop plugin for macOS speech.
- Automatic reading of completed assistant replies.
- Cantonese voice `Sinji` for Chinese and `Samantha` for English.
- Speaker button toggles automatic reading; during playback it stops and resets.
- Separate Play button reads the latest completed reply; pause and resume.
- Replay current text.
- Speed: 0.8×, 1×, 1.25×, 1.5×.
- Index-finger text picker for any readable text in the DSH page.
- Pause, resume, replay, and speed apply to both automatic and picked text.
- Local-only `/local-speech` route; same-origin requests only.
