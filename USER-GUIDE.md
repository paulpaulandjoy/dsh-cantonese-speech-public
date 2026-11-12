# 使用指南（User Guide）

> 完整人類版 PDF：[USER-GUIDE.pdf](USER-GUIDE.pdf)  
> 可編輯 DOCX：[USER-GUIDE.docx](USER-GUIDE.docx)


這份指南會跟隨 plugin 一齊更新；每次改功能，應同時更新這裡和 `CHANGELOG.md`。

## 第一次使用

1. 安裝 bundle（見 [README.md](README.md)）。
2. 重新整理 DSH 頁面。
3. 確認 macOS 有 `Sinji` 及 `Samantha` voice：
   ```sh
   say -v '?' | grep -E 'Sinji|Samantha'
   ```

## 輸入框左邊的按鈕

| 按鈕 | 平時 | 播放中 |
|---|---|---|
| 喇叭 | 開／關自動朗讀 | 黑色方塊：停止及重設 |
| ▶／⏸ | ▶ 讀最新回覆 | ⏸ 暫停；暫停後變 ▶ 繼續 |
| ↻ | 重讀目前文字（冇文字時變灰） | 重讀目前文字 |
| 速度 | 0.8×／1×／1.25×／1.5× | 即時套用 |
| 食指 | 進入選取文字模式 | 可隨時再按取消 |

## Web／手機版（Browser TTS，初版）

- Web profile 使用 Browser TTS，聲音在開網頁的裝置。
- 支援自動朗讀：按喇叭開啟；回覆穩定後自動讀出。
- 自動朗讀預設每次開頁關閉；第一次按喇叭開啟時會讀一句確認，並解鎖 browser speech。
- 支援手動 Play、手指選取、暫停／繼續、重讀、速度。
- 粵語 voice 視乎裝置；沒有時 fallback 中文或系統預設。
- Desktop profile 仍然用 macOS `say`。

## 自動朗讀

- 喇叭顯示黑色時：每個完成的助手回覆會自動讀出。
- 按一下喇叭變成禁止喇叭：關閉自動朗讀；不會再自動讀新回覆。
- 播放中按喇叭（黑色方塊）：停止所有朗讀並重設。
- 重設會清除目前文字、暫停位置、選取文字及重讀狀態，但**保留速度**及**保留原本自動朗讀開關**。
- 最新回覆會保留，供 ▶ 再播。

## 手動播放最新回覆

- 沒有播放時，按 ▶：
  - 讀「當前 session 最新一個已完成助手回覆」。
  - 由頭開始，不會接續之前位置。
  - 不會改動自動朗讀開關；禁止喇叭時只讀一次。
- 播放中按 ⏸：暫停。
- 暫停中按 ▶：繼續目前內容，不是重讀最新。

## 選取文字朗讀

1. 按食指按鈕。
2. 按鈕會閃爍，cursor 變十字，旁邊顯示「點文字 · Esc 取消」。
3. 移到文字上，會高亮將會讀的範圍。
4. 按一下文字：讀該範圍，退出選取模式。
5. Esc、右鍵、再按食指：取消。
6. 點擊會被攔截，不會誤開 link 或 button。

範圍規則：
- 回覆內文 → 整個訊息 bubble。
- 直接點 code block → 讀該段 code。
- 其他位置 → 最近訊息／段落／表格／側欄文字。
- 略過 URL；保留 code 照讀。
- 上限 8,000 字。

## 語言與聲音

- 中文（Han 字為主）→ 香港粵語 `Sinji`。
- 英文 → `Samantha`。
- 逐句選聲；中英混合會按每句比例選擇。
- 沒有安裝 voice 時可能無聲；請下載 Sinji／Samantha。

## 常見問題

**按鈕不見了？**
- 重新整理 DSH 頁面；仍未見就重開 DSH。

**沒有聲音？**
- 檢查 macOS 音量及輸出裝置。
- `say -v '?' | grep -E 'Sinji|Samantha'`。
- 測 route：
  ```sh
  curl 'http://127.0.0.1:49169/local-speech?action=status'
  ```

**停止後再按 ▶ 沒有反應？**
- 如果該 session 還沒有已完成回覆，▶ 會變灰；先等回覆完成。
- 如果剛 Stop，最新回覆仍會保留；再按 ▶ 應可重讀。

**選取範圍太大／太細？**
- Hover 外框會顯示實際範圍；可改點訊息內另一個位置，或直接點 code block。
- 如果仍然不準，記下你點的位置，回報給維護者調整 selector。


## 與 AI 合作（摘要）

每次給 AI 五樣東西：

1. 目標：要達到甚麼結果。
2. 上下文：repo 路徑、相關檔案、錯誤訊息。
3. 限制：不要改甚麼、不要 push、不要轉 Public。
4. 完成標準：怎樣才算完成。
5. 批准：先給計劃，你說「可以」才動手。

AI 應先讀 `README.md`、`USER-GUIDE.md`、`CHANGELOG.md`，再提出計劃；只改必要檔案；測試後報告改了甚麼、怎樣驗證、有甚麼未驗證。安裝、push、Release、改 Public 前，每次都要得到人類明確批准。

完整流程、prompt 模板、人手替代步驟見 PDF 第 5、6 節。

## GitHub 與 Keychain（摘要）

- Repo：`paulpaulandjoy/dsh-cantonese-speech-public`（Public）
- Release：`v1.2.0`
- License：MIT（Copyright 2026 Cheung Chi Sing）；Private 只影響誰能看到。
- GitHub CLI token 存在 macOS 登入 Keychain：
  - App：應用程式 → 工具程式 → Keychain Access
  - 檔案：`~/Library/Keychains/login.keychain-db`
  - Service：`gh:github.com`
  - Account：`<你的 GitHub 帳號>`
- 撤銷：`gh auth logout` 或 GitHub Settings → Applications。

日常更新：

```sh
cd "$HOME/Documents/dsh-cantonese-speech"
git status
git add .
git commit -m "feat: 描述改動"
git push
```

## 更新與版本

- 每次功能改動：更新 `CHANGELOG.md` 及本指南。
- Git commit message 建議：
  - `feat: ...`
  - `fix: ...`
  - `docs: ...`
- 穩定版本用 tag，例如 `v1.2.0`。
