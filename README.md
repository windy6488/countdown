# 倒数日·待办（PWA）

一个不需要 Android Studio、直接在手机浏览器里使用的“倒数日 + 待办”网页应用。可添加到手机主屏幕，像普通 App 一样全屏打开；数据保存在浏览器本地，支持导出 / 导入备份文件。

## 功能

- 新建 / 编辑 / 删除事件：名称、具体内容、截止日期
- 事件列表：显示剩余天数；已完成事件默认折叠、可展开；到期未完成的事件不折叠、始终可见
- 分类：可新建/删除分类，事件可选分类；列表页可按“全部 / 未分类 / 某个分类”筛选
- 已完成事件可切换显示方式：折叠显示，或完全不显示
- 批量导入：粘贴多行“名称还有 N 天 / 还剩 N 天 / 已经 N 天”文字，自动识别名称与截止日期后一键导入
- 多日事件：可选填开始日期，日历上整段高亮显示，列表按“未开始 / 进行中 / 已结束”显示状态
- 重要事件：新建/编辑时可勾选，列表紫色重点高亮，日历显示紫色点/条（默认不重要）
- 日历：月历上标记所有事件，点选日期可查看并操作当天事件
- 离线可用：安装后断网也能打开（PWA 缓存）
- 备份：一键导出 JSON 备份文件，或从备份文件整体恢复

## 技术栈

- React 19 + TypeScript + Vite
- vite-plugin-pwa（manifest + Service Worker 离线缓存）
- Vitest（日期与数据逻辑单元测试）

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开终端显示的地址（默认 `http://localhost:5173`）即可开发预览。

### 用手机真机预览（同一 Wi-Fi）

1. 电脑运行 `npm run dev -- --host`（加 `--host` 才能让局域网内的手机访问）。
2. 终端执行 `ipconfig`（Windows）找到电脑的 IPv4 地址，例如 `192.168.1.100`。
3. 手机连同一个 Wi-Fi，用浏览器打开 `http://192.168.1.100:5173/countdown/`。

> 局域网地址不是安全上下文，PWA 的“添加到主屏幕 / 离线缓存”等能力需要部署到 HTTPS 公网后才会完全生效；功能本身在局域网也可以完整测试。

## 测试与构建

```bash
npm test        # 单元测试
npm run build   # 类型检查 + 生产构建（输出到 dist/）
```

## 部署到 GitHub Pages

1. 在 GitHub 新建一个 **公开仓库**，仓库名必须为 **`countdown`**（若使用其他名称，需同步修改 `vite.config.ts` 中的 `BASE`，否则页面资源路径会错）。
2. 在本地项目目录执行：

   ```bash
   git init
   git add .
   git commit -m "初始化倒数日待办"
   git branch -M main
   git remote add origin https://github.com/你的用户名/countdown.git
   git push -u origin main
   ```

3. 进入仓库 **Settings → Pages**，把 “Build and deployment” 的 **Source** 选为 **GitHub Actions**。
4. push 后 Actions 会自动构建发布。访问地址：

   `https://你的用户名.github.io/countdown/`

## 手机使用建议

- 用手机自带浏览器（安卓 Chrome/Edge、苹果 Safari）打开网址，再从浏览器菜单选 **添加到主屏幕**，体验最接近 App。
- 夸克等第三方浏览器也能打开网页，但“添加到主屏幕”的完整度取决于浏览器实现，不建议作为主力。
- 数据保存在“你打开它的那个浏览器”里，换浏览器会看到空数据，请固定用一个浏览器。

## 数据备份说明

- 事件数据只保存在浏览器本地。浏览器“清除站点数据 / 清除应用数据”、卸载浏览器等都可能导致数据丢失，这是浏览器规则，应用无法阻止。
- 请定期点右上角 **导出**，把生成的 JSON 文件保存到手机下载目录或其它安全位置（如云盘）。
- 清理浏览器数据后，点右上角 **导入** 选择备份文件即可恢复（导入会覆盖当前全部事件）。

## 目录结构

```text
src/
  components/    # 列表、日历、表单、确认框等 UI
  hooks/         # 事件数据读写 hook
  lib/           # 日期、事件、存储、备份等纯逻辑（含单元测试）
public/          # PWA 图标
scripts/         # 图标生成脚本（npm run icons）
.github/workflows/  # GitHub Pages 自动部署
```
