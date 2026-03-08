# 高达指挥中心 · ALICE SYSTEM

一个基于 FastAPI + Claude AI 的高达宇宙知识库，集 MS 图鉴、战争年表、AI 问答于一体。

## 功能特性

- **MS 图鉴**：收录宇宙世纪(UC)、改历(AC)、宇宙世纪(CE)、先进世纪(AD)、正历(PD)共 18 台标志性机体，含图片、规格、战斗历史
- **战争年表**：14 场重大战争与历史事件，横跨高达全系列宇宙
- **AI 问答**：由 Claude claude-sonnet-4-6 驱动的 ALICE AI，支持工具调用，可查询 MS 数据库、对比机体性能
- **英雄展示台**：主页自动轮播精选 MS，配合阵营配色和动态背景

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Python 3.10+ / FastAPI |
| AI | Anthropic Claude claude-sonnet-4-6 |
| 前端 | 原生 HTML + CSS + JavaScript |
| HTTP 客户端 | httpx (异步) |
| 服务器 | Uvicorn |

## 项目结构

```
Gundam/
├── main.py                  # FastAPI 后端，含 AI Agent 逻辑
├── data/
│   ├── ms_database.json     # 18 台 MS 机体数据库
│   └── timeline.json        # 14 个战争/事件年表
├── static/
│   ├── index.html           # 单页应用入口
│   ├── style.css            # HUD 风格黑暗主题
│   └── app.js               # 前端逻辑（API 调用、Hero 轮播、聊天）
└── README.md
```

## 快速启动

### 1. 安装依赖

```bash
pip install fastapi uvicorn httpx anthropic
```

### 2. 设置 API Key

```bash
export ANTHROPIC_API_KEY=你的密钥
```

### 3. 启动服务

```bash
cd /path/to/Gundam
python main.py
```

访问 [http://localhost:8000](http://localhost:8000)

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 前端主页 |
| GET | `/api/ms` | MS 列表（支持 `universe`、`faction_side`、`q` 筛选） |
| GET | `/api/ms/{ms_id}` | 单台 MS 详情 |
| GET | `/api/timeline` | 战争年表（支持 `universe` 筛选） |
| GET | `/api/img?url=...` | 图片反向代理（绕过 Gundam Wiki 防盗链） |
| POST | `/api/chat` | AI 问答（含工具调用） |
| POST | `/api/commentary` | 为指定 MS 生成 AI 深度解说 |

## AI 工具

ALICE 可在回答时自动调用以下工具：

- `get_ms_details` — 查询指定 MS 的详细规格
- `search_ms` — 按关键词/宇宙搜索 MS
- `compare_ms` — 对比两台 MS 的参数
- `get_war_info` — 查询战争或历史事件
- `list_all_ms` — 列出所有 MS

## 数据库收录机体

| 宇宙 | 机体 |
|------|------|
| UC | RX-78-2 高达、MS-06S 渣古II指挥官型、MSZ-006 Z高达、RX-93 ν高达、MSN-04 沙煞比、RX-0 独角兽高达、AMX-004 卡碧尼、MSN-02 吉翁号 |
| AC | XXXG-01W 飞翼高达、XXXG-00W0 飞翼高达零式 |
| CE | GAT-X105 强袭高达、ZGMF-X10A 自由高达、ZGMF-X20A 命运高达 |
| AD | GN-001 刀剑高达、GN-0000 双零高达 |
| PD | ASW-G-08 铁血高达、XVX-016 水星魔女高达、STH-20 流星号 |
