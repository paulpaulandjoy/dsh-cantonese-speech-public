# 粵語朗讀回覆（Cantonese speech replies）

DSH Desktop 的 macOS 本機朗讀外掛：自動讀出助手回覆，或用食指按鈕選取頁面上任何文字朗讀；Sidebar 嘅 Markdown、純文字、PDF 同 Office 文件都讀得。

> **Repo 狀態：Public · MIT License。**
> GitHub：<https://github.com/paulpaulandjoy/dsh-cantonese-speech-public>
> Copyright (c) 2026 Cheung Chi Sing · 見 [LICENSE](LICENSE)。

## 功能

快速示範：[DEMO.md](DEMO.md)  
完整人類版指南：[USER-GUIDE.pdf](USER-GUIDE.pdf)  
可編輯 DOCX：[USER-GUIDE.docx](USER-GUIDE.docx)

- 自動朗讀每個完成的助手回覆；喇叭按鈕可開／關自動朗讀。
- 播放中喇叭按鈕變成停止／重設；重置後保留原本自動朗讀開關。
- 獨立的 Play 按鈕：讀當前 session 最新一個已完成回覆；播放中可暫停／繼續。
- 重讀目前文字、0.8×／1×／1.25×／1.5× 速度。
- 朗讀中的句子有粗體紅色底線（不遮字），一眼看到讀到哪裡。
- ↓ 跟隨朗讀：平時黑色（唔會跳、唔會自動翻頁）；按一下變紅，即時跳去朗讀位置並跟隨自動翻頁；再按取消。
- Sidebar 文件朗讀：Markdown、純文字／code、PDF、Office（docx／pptx）都支援；按空白由頭讀全篇，按段落讀該段。
- 食指按鈕：點選訊息、code block、段落或側欄文字朗讀。
- 中文用香港粵語 `Sinji`，英文用 `Samantha`；逐句選聲。
- 全部在本機執行，不上傳文字、不呼叫模型，沒有額外 token。

## 系統要求

- macOS（使用 `/usr/bin/say`）。
- DSH Desktop。
- 已安裝 voices：

```sh
say -v '?' | grep -E 'Sinji|Samantha'
```

如果沒有：

`系統設定 → 輔助使用 → 朗讀內容 → 系統聲音 → 管理聲音`

下載：
- 中文（香港）— Sinji（善怡）
- 英文（美國）— Samantha

## 安裝（新 Mac／朋友）

1. 下載或解壓這個 repo，得到 `dsh-cantonese-speech` 資料夾。
2. 開 DSH Desktop。
3. 去 `Settings → Plugins`，找「Install bundle／安裝 bundle」，選擇該資料夾。
4. 如果介面沒有本機資料夾選項，對 DSH agent 說：

```text
請用 plugin_manager install_bundle 安裝這個本機 bundle：
/absolute/path/to/dsh-cantonese-speech

安裝後重新載入，並確認輸入框左邊有朗讀控制。
```

5. 重新整理頁面；如仍未見按鈕，重開 DSH。

> 這是 DSH Desktop 外掛，不是獨立 app。

## 使用

完整操作說明見 [USER-GUIDE.md](USER-GUIDE.md)。

- **喇叭**：開／關自動朗讀；播放中變成黑色方塊，按一下停止並重設。
- **▶／⏸**：沒有播放時讀最新回覆；播放中暫停；暫停中繼續。
- **↻**：重讀目前文字。
- **↓**：跟隨朗讀開關；黑色＝關，紅色＝開。開啟時會跳去正在朗讀的句子，讀到接近頁尾會自動翻頁。
- **Sidebar 文件**：打開 md／txt／code／PDF／Office 後按食指；按空白由第一句讀全篇，按段落只讀該段。
- **速度**：0.8×、1×、1.25×、1.5×。
- **食指**：按一下進入選取模式，hover 會高亮範圍，按文字朗讀；Esc／右鍵取消。
- 讀 DSH 頁面內可選文字：對話、Sidebar 嘅 Markdown、純文字、PDF 文字層同 Office 預覽。
- Excel、HTML 預覽、圖片、掃描 PDF（冇文字層）同跨 origin iframe 讀不到；任意外部網站亦刻意唔支援，保障私隱。

## Web／手機版（Browser TTS）

- 在 **web profile** 使用時，plugin 會自動用 Browser TTS（Web Speech API），聲音由開網頁的裝置播出，不經 Mac 的 `say`。
- **支援自動朗讀**：按喇叭開啟；回覆穩定後會自動讀出。
- 自動朗讀預設每次開頁關閉；第一次按喇叭開啟時會讀一句確認，並解鎖 browser speech。
- 喇叭黑色＝自動朗讀開；禁止喇叭＝關；播放中變黑色方塊＝停止及重設。
- 支援手動 Play、手指選取文字、暫停／繼續、重讀、速度，以及 Sidebar 文件朗讀。
- 同樣有粗體紅色底線標示正在朗讀的句子，以及 ↓ 跟隨朗讀位置／自動翻頁。
- 粵語 voice 視乎裝置；沒有時會 fallback 中文或系統預設。
- Desktop profile 仍然用 macOS `say`。
- iOS autoplay 可能仍要求手勢；如果冇聲，先按一次喇叭或 ▶。

## 版本控制

- GitHub Desktop：見 [GITHUB-DESKTOP.md](GITHUB-DESKTOP.md)。
- GitHub CLI（`gh`）：見 [GITHUB-CLI.md](GITHUB-CLI.md)。

這個 repo：

```sh
git clone https://github.com/paulpaulandjoy/dsh-cantonese-speech-public.git
```

簡短流程（GitHub Desktop）：

1. GitHub Desktop → `File → Add Local Repository` → 選這個資料夾。
2. 寫 commit message → `Commit to main`。
3. `Publish repository`，勾選 `Keep this code private`。
4. 日後改完 → commit → `Push origin`。

## 分享

- Private repo：加朋友做 collaborator，或直接傳 zip。
- Public repo：任何人有 link 都可以下載。
- 本專案已用 MIT License：拿到 code 的人可以使用、修改、再分享，但要保留 copyright notice。
- Private 只影響誰能看到，不影響 MIT 授權。

## 更新與移除

- 更新：Replace 檔案 → commit → push；在 DSH disable/enable 外掛或重開。
- 移除：DSH Plugin Manager 移除外掛；不影響對話或專案。

## 減少 token 的做法

- 把這個 repo 當唯一 source of truth。
- 新機／新 session 只需叫 agent「讀 README，然後安裝這個資料夾」，不要重新生成 plugin。
- 改功能時只指出要改的檔案和行為，不要重貼全部 code。
- 用 GitHub commit／tag／Release 記錄版本，而不是靠聊天記錄。

## Security

See [SECURITY.md](SECURITY.md) for the security model, reporting process and hardening advice.

## License

MIT License，Copyright (c) 2026 **Cheung Chi Sing**。

你可以保留 Private，也可以日後轉 Public；MIT 授權不會因 Private 而失效。

## Disclaimer

This is free software provided "as is", without warranty of any kind. Use it at your own risk. The author is not liable for any loss or damage arising from its use. This project is not affiliated with or endorsed by DeepSeek. No support, fitness for a particular purpose, or compatibility with future DSH/macOS versions is guaranteed.

本軟件按「現狀」提供，不附帶任何明示或暗示保證。使用風險由使用者自行承擔；作者不對因使用本軟件而引致的任何直接或間接損失負責。本專案與 DeepSeek 並無隸屬或背書關係，亦不保證支援、特定用途適用性或未來 DSH／macOS 兼容性。
