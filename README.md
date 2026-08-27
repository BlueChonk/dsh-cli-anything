# DSH Plugin for CLI-Anything

将 [CLI-Anything](https://github.com/HKUDS/CLI-Anything) 集成到 DSH (DeepSeek Harness) 的插件方案。安装后会在 DSH Web UI 的「插件」页面显示，通过自然语言即可浏览、安装、启动和管理 100+ CLI 工具。

## 功能

- **浏览工具**：列出所有可用的 CLI-Anything 工具，按类别分组
- **搜索工具**：按关键词搜索感兴趣的 CLI 工具
- **查看详情**：查看工具描述、安装方式、命令数等详细信息
- **安装工具**：一键安装 CLI-Anything 工具到本地
- **启动工具**：直接启动已安装的 CLI 工具
- **更新工具**：将已安装工具更新到最新版本
- **卸载工具**：安全卸载不需要的工具

## 前置依赖

```bash
pip install cli-anything-hub
```

## 安装

### 方式一：GitHub Release（推荐）

从 [Releases](https://github.com/BlueChonk/dsh-cli-anything/releases) 下载最新 tarball，然后：

```bash
dsh plugin --profile web add ./BlueChonk-dsh-cli-anything-0.1.0.tgz
```

### 方式二：开发模式

```bash
# 克隆仓库
git clone https://github.com/BlueChonk/dsh-cli-anything.git
cd dsh-cli-anything

# 安装依赖并构建
npm install
npm run prepare

# 启动 DSH Web（开发模式）
dsh --profile web --patch ./patch.yml web
```

### 方式三：Bundle 安装

```bash
dsh plugin --profile web add ./dsh-cli-anything
```

## 提供的工具

| 工具名 | 说明 |
|--------|------|
| `cli_hub_list` | 列出所有可用工具 |
| `cli_hub_search` | 按关键词搜索 |
| `cli_hub_info` | 查看工具详情 |
| `cli_hub_install` | 安装工具（需确认） |
| `cli_hub_launch` | 启动工具 |
| `cli_hub_update` | 更新工具（需确认） |
| `cli_hub_uninstall` | 卸载工具（需确认） |

## 使用示例

在 DSH Web UI 对话界面中输入：

```
列出所有 cli-anything 工具
搜索 ai 相关的工具
看看 ollama 的详细信息
帮我安装 ollama
启动 clibrowser
```

## 文件结构

```
dsh-cli-anything/
├── package.json          # npm 包配置 + dsh.bundle 声明
├── cordis.patch.yml      # 插件补丁配置
├── src/
│   ├── index.ts          # 插件入口
│   └── utils.ts          # 工具函数
├── test/
│   ├── validateInput.test.ts
│   ├── runCliHub.test.ts
│   └── apply.test.ts
├── lib/                  # 构建产物（npm run prepare 生成）
├── patch.yml             # 开发模式 patch 配置
└── README.md             # 本文件
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run prepare

# 运行测试
npm test

# 打包 tarball
npm pack
```

## 技术栈

- TypeScript
- Cordis (DSH 插件框架)
- Schemastery (配置校验)
- tsdown (构建工具)
- vitest (测试框架)

## 许可证

[MIT](LICENSE)
