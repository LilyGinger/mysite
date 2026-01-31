# 笔记功能使用说明

## 功能简介

你的网站现在已经集成了一个基于 GitHub Gist 的私密笔记系统，可以：

- ✅ 随时记录想法和笔记
- ✅ 自动保存发布日期和修改日期
- ✅ 查看所有历史笔记列表
- ✅ 编辑和删除笔记
- ✅ 完全私密（数据存储在你的私密GitHub Gist 中）
- ✅ 跨设备同步（只要使用同一个 GitHub Token）

## 首次设置步骤

### 1. 获取 GitHub Personal Access Token

1. 访问 [GitHub Token 创建页面](https://github.com/settings/tokens/new)
2. 在 "Note" 字段填写：`My Notes App`
3. 在 "Expiration" 选择：`No expiration`（永不过期）
4. 在权限列表中，**只勾选** `gist` 权限
5. 点击页面底部的 "Generate token" 按钮
6. **重要**：复制生成的 token（类似：`ghp_xxxxxxxxxxxx`），这个 token 只会显示一次！

### 2. 连接到网站

1. 重新构建并启动你的 Hugo 网站：
   ```bash
   hugo
   hugo server
   ```

2. 在浏览器中访问笔记页面：`http://localhost:1313/notes/`

3. 在输入框中粘贴你的 GitHub Token

4. 点击 "连接 GitHub" 按钮

5. 连接成功后，Token 会安全地保存在浏览器本地存储中，下次访问时会自动连接

## 使用方法

### 添加笔记

1. 在 "添加新笔记" 区域
2. 输入标题（可选）
3. 在文本框中输入笔记内容
4. 点击 "保存笔记"

### 编辑笔记

1. 在笔记列表中找到要编辑的笔记
2. 点击 "编辑" 按钮
3. 修改内容后点击 "保存笔记"

### 删除笔记

1. 在笔记列表中找到要删除的笔记
2. 点击 "删除" 按钮
3. 确认删除

###刷新笔记列表

点击 "刷新" 按钮可以从 GitHub 重新加载最新的笔记数据

## 数据存储说明

-所有笔记数据存储在你的 GitHub 账号下的一个私密 Gist 中
- Gist 描述为：`My Private Notes`
- 数据格式：JSON
- 完全私密，只有你能看到

## 安全提示

1. **Token 安全**：
   - GitHub Token 保存在浏览器的localStorage 中
   - 不要在公共电脑上使用
   - 如果 Token 泄露，立即到 GitHub 撤销该Token

2. **数据备份**：
   - 你可以随时访问 [GitHub Gists](https://gist.github.com/) 查看和备份数据
   - 找到描述为 "My Private Notes" 的 Gist
   - 下载 `notes.json` 文件即可备份

3. **断开连接**：
   - 点击 "断开连接" 会清除浏览器中保存的 Token
   - 不会删除 GitHub上的笔记数据
   - 重新连接后可以继续使用

## 跨设备使用

只需在不同设备上使用相同的 GitHub Token 连接，即可同步访问所有笔记。

## 故障排除

**Q: 提示 "Token 无效"？**
- 检查 Token 是否正确复制
- 确认 Token 是否已过期
- 确认 Token 是否勾选了 `gist` 权限

**Q: 笔记无法保存？**
- 检查网络连接
- 刷新页面后重试
- 查看浏览器控制台是否有错误信息

**Q: 找不到之前的笔记？**
- 点击 "刷新" 按钮
- 确认使用的是同一个 GitHub Token
- 访问 GitHub Gists 检查数据是否存在

## 部署到生产环境

在部署网站时，确保以下文件都已包含：

- `content/notes/_index.md`
- `layouts/_default/notes.html`
- `static/js/notes-app.js`
- `hugo.toml`（已更新菜单配置）

构建命令：
```bash
hugo
```

构建后的文件会在 `public/` 目录中。