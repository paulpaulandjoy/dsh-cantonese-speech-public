# GitHub Desktop — 新手步驟

這個資料夾已經係一個本地 Git repository，亦已經有第一個 commit。你只需要將它發佈到 GitHub。

## 第一次發佈

1. 安裝 GitHub Desktop：<https://desktop.github.com/>
2. 開 GitHub Desktop，用你嘅 GitHub account 登入。
3. 選 `File → Add Local Repository`。
4. 選擇：
   `<你的資料夾>/dsh-cantonese-speech`
5. 左手邊應該見到 `dsh-cantonese-speech`，History 有一個 `Initial commit`。
6. 按右上角 `Publish repository`。
7. 在彈出視窗：
   - Name：`dsh-cantonese-speech`
   - Description：`Cantonese/English local speech for DSH Desktop`
   - **勾選 `Keep this code private`**
8. 按 `Publish repository`。

完成後，GitHub 上會有一個 Private repo。你可以按 `Repository → View on GitHub` 確認。

## 之後每次改動

1. 改檔案。
2. GitHub Desktop 會顯示 Changes。
3. 左下角寫 commit message，例如：
   `Fix play button after stop`
4. 按 `Commit to main`。
5. 按 `Push origin`。

## 版本 tag（可選）

1. GitHub Desktop → `History`。
2. 右鍵第一個 commit → `Create tag`。
3. 輸入 `v1.0.0`，建立。
4. 按 `Push origin` 推送 tag。

之後可在 GitHub 網站：
`Releases → Draft a new release` → 選 `v1.0.0` → 上載 zip。

## 加朋友做 collaborator

Private repo 預設只有你看到。

GitHub 網站 → repo → `Settings → Collaborators → Add people`。
朋友接受邀請後才看到。

## 幾時轉 Public

1. 先決定 License，加入 `LICENSE`。
2. 檢查 history 沒有密碼、token、私人資料。
3. GitHub 網站 → `Settings → General → Danger Zone → Change repository visibility`。
4. 選 `Make public`。

注意：一轉 Public，整個 history 都會公開；可能已被 fork／下載，不能當完全收回。

## 常見問題

- **Add Local Repository 說不是 Git repo**：確認你選的是 `dsh-cantonese-speech` 資料夾，而不是上層 `github-repos`。
- **Publish 按鈕灰色**：先登入 GitHub Desktop，或確認已有 commit。
- **Push 失敗**：先 `Fetch origin`，再 `Pull`，然後再 push。
- **不想公開**：保持 Private；分享 zip 或加 collaborator。
