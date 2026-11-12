# Security Policy

## Supported versions

The latest release is supported. Older releases may receive fixes on a best-effort
basis only.

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting**:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version, reproduction steps, and impact.

Do not open a public issue for a sensitive report. Do not include passwords,
tokens, 2FA codes, or private conversation text in a report.

This is a volunteer project. There is no bug bounty or guaranteed response time,
but reports will be reviewed in good faith.

## Security model

- The plugin runs locally in DSH. It does not upload conversation text to a
  third-party service and does not require an API key.
- The desktop profile uses macOS `/usr/bin/say`.
- The web profile uses the browser's `speechSynthesis` API; speech is generated
  on the device that opens the page.
- The optional `/local-speech` HTTP route is a local convenience endpoint. It has
  a same-origin check, but it is **not a general authentication boundary**. Do not
  expose the DSH web server to an untrusted network.
- The DSH web URL may contain an access token. Do not share the full tokenized URL
  in screenshots, issues, chat messages, or public repositories.

## Hardening recommendations

- Run the DSH web server only on a trusted LAN or behind an authenticated reverse
  proxy with HTTPS.
- Do not port-forward DSH directly to the public internet.
- Keep the repository Private until its history and content have been reviewed.
- Keep personal, family, pastoral, and unpublished media in a separate Private
  repository, never in the public plugin repository.
- Enable 2FA on the GitHub account and review the account's public email setting.
- Install plugins only from sources you trust; review the source before running
  them.
- Use the latest release.

## Known limitations

- The `/local-speech` route can be reached by local processes that can connect to
  the DSH web server; the same-origin check is not a substitute for network
  isolation.
- Browser speech synthesis availability, voices, and autoplay behaviour depend on
  the device and browser.
- This project is provided under the MIT License, without warranty. See
  [LICENSE](LICENSE) and the README disclaimer.
