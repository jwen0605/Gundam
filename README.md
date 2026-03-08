# 高达指挥中心 · ALICE SYSTEM

一个基于 FastAPI + Claude AI 的高达宇宙知识库，集 MS 图鉴、战争年表、AI 问答于一体。

A Gundam Universe knowledge base powered by FastAPI + Claude AI, featuring a Mobile Suit encyclopedia, war timeline, and AI Q&A.

## 功能特性 · Features

- **MS 图鉴**：收录宇宙世纪(UC)、改历(AC)、宇宙世纪(CE)、先进世纪(AD)、正历(PD)共 18 台标志性机体，含图片、规格、战斗历史
  **MS Encyclopedia**: 18 iconic Mobile Suits across UC, AC, CE, AD, and PD universes — with images, specs, and combat history.

- **战争年表**：14 场重大战争与历史事件，横跨高达全系列宇宙
  **War Timeline**: 14 major wars and historical events spanning the entire Gundam multiverse.

- **AI 问答**：由 Claude claude-sonnet-4-6 驱动的 ALICE AI，支持工具调用，可查询 MS 数据库、对比机体性能
  **AI Q&A**: ALICE AI powered by Claude claude-sonnet-4-6, with tool-calling support for querying the MS database and comparing unit performance.

- **英雄展示台**：主页自动轮播精选 MS，配合阵营配色和动态背景
  **Hero Showcase**: Auto-rotating carousel of featured Mobile Suits on the homepage, with faction-themed colors and dynamic backgrounds.

## 技术栈 · Tech Stack

| 组件 Component | 技术 Technology |
|----------------|-----------------|
| 后端 Backend | Python 3.10+ / FastAPI |
| AI | Anthropic Claude claude-sonnet-4-6 |
| 前端 Frontend | Vanilla HTML + CSS + JavaScript |
| HTTP 客户端 HTTP Client | httpx (async) |
| 服务器 Server | Uvicorn |

## 项目结构 · Project Structure

```
Gundam/
├── main.py                  # FastAPI backend with AI Agent logic
├── data/
│   ├── ms_database.json     # 18 MS unit database
│   └── timeline.json        # 14 wars/events timeline
├── static/
│   ├── index.html           # Single-page app entry
│   ├── style.css            # HUD-style dark theme
│   └── app.js               # Frontend logic (API calls, hero carousel, chat)
└── README.md
```

## 快速启动 · Quick Start

### 1. 安装依赖 · Install Dependencies

```bash
pip install fastapi uvicorn httpx anthropic
```

### 2. 设置 API Key · Set API Key

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### 3. 启动服务 · Start Server

```bash
cd /path/to/Gundam
python main.py
```

访问 · Visit [http://localhost:8000](http://localhost:8000)

## API 端点 · API Endpoints

| 方法 Method | 路径 Path | 说明 Description |
|-------------|-----------|------------------|
| GET | `/` | 前端主页 Frontend homepage |
| GET | `/api/ms` | MS 列表 MS list (filters: `universe`, `faction_side`, `q`) |
| GET | `/api/ms/{ms_id}` | 单台 MS 详情 Single MS details |
| GET | `/api/timeline` | 战争年表 War timeline (filter: `universe`) |
| GET | `/api/img?url=...` | 图片反向代理 Image reverse proxy (bypass Gundam Wiki hotlink protection) |
| POST | `/api/chat` | AI 问答 AI Q&A (with tool calling) |
| POST | `/api/commentary` | 为指定 MS 生成 AI 深度解说 Generate AI deep commentary for a specified MS |

## AI 工具 · AI Tools

ALICE 可在回答时自动调用以下工具：
ALICE can automatically invoke the following tools when responding:

- `get_ms_details` — 查询指定 MS 的详细规格 / Query detailed specs of a specified MS
- `search_ms` — 按关键词/宇宙搜索 MS / Search MS by keyword or universe
- `compare_ms` — 对比两台 MS 的参数 / Compare stats of two MS units
- `get_war_info` — 查询战争或历史事件 / Query war or historical event info
- `list_all_ms` — 列出所有 MS / List all MS units

## 数据库收录机体 · MS Database

| 宇宙 Universe | 机体 Mobile Suits |
|---------------|-------------------|
| UC | RX-78-2 Gundam, MS-06S Zaku II Commander Type, MSZ-006 Zeta Gundam, RX-93 ν Gundam, MSN-04 Sazabi, RX-0 Unicorn Gundam, AMX-004 Qubeley, MSN-02 Zeong |
| AC | XXXG-01W Wing Gundam, XXXG-00W0 Wing Gundam Zero |
| CE | GAT-X105 Strike Gundam, ZGMF-X10A Freedom Gundam, ZGMF-X20A Destiny Gundam |
| AD | GN-001 Exia, GN-0000 00 Gundam |
| PD | ASW-G-08 Gundam Barbatos, XVX-016 Gundam Aerial, STH-20 Hekija |
