# Mindful Words

[English](README.md) | [简体中文](README.zh-CN.md)

一款 Chrome 扩展：从网页摘录文字，让它们可搜索、可加标签、可导出——全部数据都留在你自己的设备上。

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4)
![Build](https://img.shields.io/badge/build-none-success)
![License: ISC](https://img.shields.io/badge/license-ISC-lightgrey)

## 概述

Mindful Words 把选中的文字连同页面标题与 URL 保存为一条笔记，并在浏览器侧边栏里供你查阅。笔记可以编辑、加标签、筛选、复制、导出或发送到 Anki。所有数据都存放在 `chrome.storage.local`。没有账号、没有同步服务、没有统计上报，也没有构建流程——源码目录本身就是扩展。

## 功能

### 捕获

| 触发方式 | 行为 |
| --- | --- |
| `Ctrl` + `Shift` + `S` | 保存当前选中的文字 |
| `Ctrl` + 单击 | 保存当前选中的文字 |
| 右键选中文字 → **保存到 Mindful Words** | 通过右键菜单保存 |

每条笔记包含 `content`、`note`（个人笔记）、`title`、`url`、`tags`、`createdAt` 和 `updatedAt`。来源站点由 URL 解析得到。单次保存上限 10,000 字符，两次保存间隔至少 1 秒。

### 整理

- 侧边栏全文搜索，覆盖正文、标题与个人笔记。
- 按标签、来源站点和时间筛选——今天、昨天、本周、本月、最近 7 / 30 天，或自定义日期区间。生效的筛选条件显示为可移除的 chip 标签。
- 点击卡片可编辑正文、个人笔记与标签。`Escape` 或点击遮罩关闭弹窗。
- 多选模式：批量复制到剪贴板、导出或删除。**全选**只作用于当前可见（筛选后）的笔记。
- 侧边栏重新打开时恢复滚动位置。

### 导出与集成

- 选中笔记 → **JSON**、**CSV**、**TXT** 或 **Anki**。
- 设置页 → 完整备份（`notes` + `settings`）为 JSON，并可导回。重复 ID 会跳过。
- AnkiConnect：选择牌组与笔记模型，发送前检测重复，每张卡片附加 `mindful-words` 标签。

### 偏好设置

- 主题：浅色、深色、跟随系统。
- 语言：English / 简体中文，运行时切换，无需重载。
- 数据页：标签管理、使用统计、存储占用、导入 / 导出、清空全部（需输入 `DELETE` 确认）。

## 环境要求

- 支持 Side Panel API 的 Chromium 浏览器（Chrome 114+ 或同等版本）。
- **无运行时依赖。** Node.js 22+ 与 Python 3 仅用于运行测试和图标脚本。

## 安装

扩展直接从源码加载，无需编译、打包或安装依赖。

1. 克隆仓库：

   ```bash
   git clone https://github.com/yangyongze/mindful-words.git
   ```

2. 打开 `chrome://extensions/`，开启**开发者模式**。
3. 点击**加载已解压的扩展程序**，选择包含 `manifest.json` 的目录。
4. 点击工具栏的 Mindful Words 图标打开侧边栏。**选项**可从扩展卡片进入，也可点击侧边栏的齿轮按钮。

首次安装会写入两条示例笔记，侧边栏不会是空的。

修改源码后，点击扩展卡片上的重新加载按钮。`src/background/main.js` 是 service worker，改动后必须完整重载扩展。

> 不能直接通过 `file://` 打开 `popup.html` 和 `options.html`。它们使用 ES 模块和只在扩展上下文中存在的 `chrome.*` API。

## 项目结构

```text
.
├── manifest.json               MV3 配置：service worker、内容脚本、侧边栏、选项页
├── popup.html / popup.css       侧边栏界面
├── options.html / options.css  设置页界面
├── src/
│   ├── core/
│   │   ├── mw.js               共享核心，暴露为 globalThis.MW
│   │   └── theme.css           设计变量的唯一来源
│   ├── background/main.js      Service worker：命令表、右键菜单、首次安装示例数据
│   ├── content/main.js         选区捕获与页面内通知
│   ├── popup/                  main、notes-view、filters、exporter、anki
│   └── options/main.js         设置、标签、统计、备份、清空
├── tests/
│   ├── core.test.mjs           Node 测试
│   └── test_frontend.py        Playwright 行为测试，带 chrome stub
├── scripts/                    图标生成（Pillow / reportlab）
└── icons/                      manifest.json 引用的 PNG 资源
```

## 架构

三条不变量让代码库保持精简：

1. **单一核心契约。** `src/core/mw.js` 定义 UI 文案、消息与命令名、存储键、限额、笔记模型、i18n、消息总线、通知组件、主题处理与备份格式。侧边栏、选项页、service worker 与内容脚本都加载同一个文件。
2. **单一写入者。** 所有笔记变更都经过 `src/background/main.js` 里串行的命令表（`save`、`delete`、`update`、`removeTag`、`import`、`clear`）。任何界面都不直接写笔记数组。
3. **单一刷新通道。** `chrome.storage.onChanged` 是让侧边栏与选项页同笔记、设置保持同步的唯一机制。

由此：新增一个操作 = 在命令表加一项；新增一条 UI 文案 = 在 `STRINGS` 的每种语言各加一个键；新增一个设计变量 = 在 `src/core/theme.css` 加一条声明。

## 权限与隐私

| 权限 | 用途 |
| --- | --- |
| `storage` | 在本机持久化笔记与设置 |
| `activeTab` | 从右键菜单保存时读取当前标签页的标题与 URL |
| `contextMenus` | 提供右键保存操作 |
| `sidePanel` | 从工具栏图标打开笔记侧边栏 |

- 笔记与设置始终留在本机的 `chrome.storage.local`。
- 没有账号、遥测、统计上报或远程端点。
- 全库唯一的网络请求是本地 `POST http://127.0.0.1:8765`，且只在你主动把笔记发送到 Anki 时发生。
- 内容脚本注册在所有 URL 上，因为任意页面都可能触发保存；它只在你触发保存动作时读取选区。

## Anki 集成

1. 安装 AnkiConnect 插件并保持 Anki 运行。
2. 确认它监听 `http://127.0.0.1:8765`（API 版本 5），且其 CORS 策略允许扩展来源。
3. 在侧边栏中：选中笔记 → **导出** → **发送到 Anki** → 选择牌组与笔记模型。

模型的第一个字段放保存的正文，第二个字段放个人笔记、来源、标签与日期。单字段模型会把两者合并。存在 `Basic` 模型时优先使用它。

## 开发

### 测试

```bash
python -m pip install -r requirements.txt
python -m playwright install chromium   # 已安装系统 Chrome 时可选
npm test
```

`npm test` 运行两套测试：

| 命令 | 覆盖范围 |
| --- | --- |
| `npm run test:core` | 11 个 Node 测试：i18n、笔记模型、筛选、HTML 转义、备份格式、设置契约、命令协议 |
| `npm run test:ui` | 15 个 Playwright 测试：渲染、搜索、筛选、多选、编辑、导出、主题与语言切换、选项页、滚动位置恢复 |

浏览器测试通过本地 HTTP 服务提供仓库文件，并在页面加载前注入 `chrome` stub，因此不需要安装扩展。若 Playwright 自带浏览器不可用，会回退到系统 Chrome。

### 图标

```bash
python scripts/generate_icons.py    # 重新生成 icons/icon*.png
python scripts/create_icon_pdf.py   # 重新生成图标设计说明
```

### 约定

- 源码是原生 ES 模块。`src/core/mw.js` 刻意写成经典脚本，以便内容脚本通过 `manifest.json` 的 `content_scripts` 列表按顺序加载。
- i18n 占位符为 `$1$`、`$2$` ……；两种语言必须有完全相同的键集合（由测试保证）。
- `.gitattributes` 将文本文件统一为 LF。

## 故障排查

| 现象 | 原因 |
| --- | --- |
| 出现「扩展已更新。请刷新页面以继续保存笔记。」提示条 | 扩展在页面打开期间被重新加载；点击提示条上的刷新按钮。 |
| 出现「AnkiConnect 未运行」通知 | Anki 或插件未启动、端口不是 `8765`，或请求被 CORS 拦截。 |
| 清空数据后没有笔记 | 安装之后不会再自动写入示例；只有全新安装才添加那两条示例笔记。 |

## 参与贡献

没有构建步骤：修改源码 → 重载扩展 → 提交 PR 前运行 `npm test`。保持 `STRINGS` 两种语言同步，任何用户可见的改动都补一个行为测试。

## 许可证

ISC，见 `package.json`。
