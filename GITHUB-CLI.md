# GitHub CLI（gh）流程

這份文件記錄本 repo 用 GitHub CLI 管理版本的方式；不需要 GitHub Desktop。

## 安裝 `gh`

### 方法 A：Homebrew
```sh
brew install gh
```

如果 `/opt/homebrew` 權限不足，不要強行 `sudo chown`；改用可攜版。

### 方法 B：可攜版（本機使用）
1. 去 <https://github.com/cli/cli/releases/latest>。
2. 下載 `gh_<version>_macOS_arm64.zip`（Apple Silicon）或 `macOS_amd64.zip`（Intel）。
3. 解壓到一個工具資料夾，例如：
   ```text
   tools/gh_<version>_macOS_arm64/bin/gh
   ```
4. 驗證：
   ```sh
   ./tools/gh_<version>_macOS_arm64/bin/gh --version
   ```

可攜版不會改系統 Homebrew；刪除資料夾即可移除。

## 登入（由你本人完成）

```sh
gh auth login --hostname github.com --git-protocol https --web
```

- 用 Safari／任何瀏覽器開 <https://github.com/login/device>。
- 輸入 terminal 顯示的一次性 code。
- 完成 GitHub 登入及 2FA。
- Token 存在 macOS Keychain；不要把 token 寫入檔案或聊天。

驗證：

```sh
gh auth status
```

應顯示 `Logged in to github.com account <你的帳號>`。

## 建立 Private repo

在本 repo 資料夾：

```sh
gh repo create dsh-cantonese-speech \
  --private \
  --source=. \
  --remote=origin \
  --push
```

- `--private` 必須保留；未加 License 前不要 Public。
- 完成後 `origin` 會指向 GitHub。

## 日常更新

```sh
git status
git add .
git commit -m "feat: describe the change"
git push origin main
```

## Tag 與 Release

```sh
git tag -a v1.0.3 -m "v1.0.3"
git push origin v1.0.3
```

建立 zip（排除 `.git`）：

```sh
cd ..
zip -r dsh-cantonese-speech-1.0.3.zip dsh-cantonese-speech -x '*.DS_Store' '*/.git/*'
```

建立 Release：

```sh
gh release create v1.0.3 \
  --title "v1.0.3" \
  --notes "Describe the changes." \
  dsh-cantonese-speech-1.0.3.zip
```

Private repo 的 Release 也只有你和 collaborator 看到。

## 修改 repo 設定

```sh
gh repo edit \
  --description "macOS local speech for DSH Desktop" \
  --add-topic dsh-plugin \
  --add-topic macos \
  --add-topic text-to-speech
```

## 加 collaborator（Private repo）

GitHub 網站 → repo → `Settings → Collaborators → Add people`。
或使用：

```sh
gh api -X PUT repos/<owner>/<repo>/collaborators/<username>
```

## 撤銷授權

```sh
gh auth logout
```

或在 GitHub `Settings → Applications` 撤銷 GitHub CLI。

## 安全規則

- 不要把 token、密碼、2FA code 貼進聊天或 commit。
- Public 之前先加 License，並檢查 Git history。
- 每次 remote 變更（push、tag、Release、visibility）都應由 repo owner 確認。
