# Changelog

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
