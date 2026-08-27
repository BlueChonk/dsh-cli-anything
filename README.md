# DSH Plugin for CLI-Anything

将 CLI-Anything 集成到 DSH 的插件方案。安装后会在 DSH Web UI 的「插件」页面显示。

## 安装

### 开发模式（使用 patch）

```bash
dsh --profile web --patch ./patch.yml web
```

### 安装为 Bundle

```bash
dsh plugin --profile web add ./dsh-cli-anything
```

## 文件结构

```
dsh-cli-anything/
├── package.json          # npm 包配置 + dsh.bundle 声明
├── cordis.patch.yml      # 插件补丁配置
├── src/
│   ├── index.ts          # TypeScript 源码
│   └── utils.ts          # 工具函数
├── test/
│   ├── validateInput.test.ts
│   ├── runCliHub.test.ts
│   └── apply.test.ts
├── lib/                  # 构建产物（npm run prepare 生成）
├── patch.yml             # 开发模式 patch 配置
└── README.md             # 本文件
```

## 提供的工具

| 工具名 | 说明 |
|--------|------|
| `cli_hub_list` | 列出所有可用工具 |
| `cli_hub_search` | 按关键词搜索 |
| `cli_hub_info` | 查看工具详情 |
| `cli_hub_install` | 安装工具 |
| `cli_hub_launch` | 启动工具 |
| `cli_hub_update` | 更新工具 |
| `cli_hub_uninstall` | 卸载工具 |

## 前置依赖

```bash
pip install cli-anything-hub
```

## 开发测试

```bash
# 验证配置
dsh --profile web --patch ./patch.yml --dump-config

# 启动 Web UI
dsh --profile web --patch ./patch.yml web
```
