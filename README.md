# 粵語朗讀回覆（Cantonese speech replies）

DSH Desktop 的 macOS 本機朗讀外掛：自動讀出助手回覆，或用食指按鈕選取頁面上任何文字朗讀。

> **Repo 狀態：Private · MIT License。**
> GitHub：<https://github.com/paulpaulandjoy/dsh-cantonese-speech-public>
> Copyright (c) 2026 Cheung Chi Sing · 見 [LICENSE](LICENSE)。

## 功能

完整人類版指南：[USER-GUIDE.pdf](USER-GUIDE.pdf)  
可編輯 DOCX：[USER-GUIDE.docx](USER-GUIDE.docx)

- 自動朗讀每個完成的助手回覆；喇叭按鈕可開／關自動朗讀。
- 播放中喇叭按鈕變成停止／重設；重置後保留原本自動朗讀開關。
- 獨立的 Play 按鈕：讀當前 session 最新一個已完成回覆；播放中可暫停／繼續。
- 重讀目前文字、0.8×／1×／1.25×／1.5× 速度。
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
- **速度**：0.8×、1×、1.25×、1.5×。
- **食指**：按一下進入選取模式，hover 會高亮範圍，按文字朗讀；Esc／右鍵取消。
- 只讀 DSH 頁面內 DOM 文字；PDF canvas、圖片內文字、跨 origin iframe 讀不到。

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

## License

MIT License，Copyright (c) 2026 **Cheung Chi Sing**。

你可以保留 Private，也可以日後轉 Public；MIT 授權不會因 Private 而失效。

## Disclaimer

This is free software provided "as is", without warranty of any kind. Use it at your own risk. The author is not liable for any loss or damage arising from its use. This project is not affiliated with or endorsed by DeepSeek. No support, fitness for a particular purpose, or compatibility with future DSH/macOS versions is guaranteed.

本軟件按「現狀」提供，不附帶任何明示或暗示保證。使用風險由使用者自行承擔；作者不對因使用本軟件而引致的任何直接或間接損失負責。本專案與 DeepSeek 並無隸屬或背書關係，亦不保證支援、特定用途適用性或未來 DSH／macOS 兼容性。
