# Gundam Command Center · ALICE SYSTEM
# 高达指挥中心 · ALICE SYSTEM

> **Ask ALICE anything about the Gundam universe — she'll pull real data, compare Mobile Suits, and answer like a true MS analyst.**

A full-stack Gundam knowledge base powered by **FastAPI + Claude AI**, featuring a Mobile Suit encyclopedia, war timeline, and an AI agent that *actually uses tools* to answer your questions.

---

## Why This Is Cool · 亮点所在

### ALICE Doesn't Just Chat — She Acts

Most AI chatbots answer from memory. ALICE is different: when you ask a question, she **decides which tools to call**, fetches live data from the MS database, and reasons over the results before replying. This is [Claude's Tool Use](https://docs.anthropic.com/en/docs/tool-use) in action.

**Example conversation:**

> **You:** "Who would win — ν Gundam or Sazabi?"
>
> **ALICE:** *(internally calls `get_ms_details` for RX-93 and MSN-04, then `compare_ms`)* → Returns a structured breakdown of output, armor, pilot skill, and historical context.

No hardcoded answers. Real reasoning over real data.

### How Claude Tool Use Works Here

```
User Question
     │
     ▼
Claude (claude-sonnet-4-6) decides which tool(s) to call
     │
     ├─ get_ms_details("rx-93")   ← fetches from ms_database.json
     ├─ compare_ms("rx-93", "msn-04")
     └─ get_war_info("First Neo Zeon War")
     │
     ▼
Claude reads tool results and crafts a final answer
```

The AI doesn't guess — it **queries**, **reads**, and **reasons**. The agentic loop runs until Claude is satisfied it has enough data to give a complete answer.

### Built With Claude claude-sonnet-4-6

- Roleplayed as **ALICE** (Advanced Logistic & Intelligence Command Engine)
- System prompt defines her persona: a passionate MS historian and analyst
- Supports multi-turn tool calls in a single response
- `/api/commentary` endpoint lets Claude generate deep-dive analyses for any MS on demand

---

## Features · 功能特性

- **MS Encyclopedia**: 18 iconic Mobile Suits across UC, AC, CE, AD, and PD universes — with images, specs, and combat history.
  （MS 图鉴：收录 5 大宇宙共 18 台标志性机体）

- **War Timeline**: 14 major wars and historical events spanning the entire Gundam multiverse.
  （战争年表：14 场重大战争与历史事件）

- **AI Q&A**: ALICE AI powered by Claude claude-sonnet-4-6, with tool-calling support for querying the MS database and comparing unit performance.
  （AI 问答：由 Claude claude-sonnet-4-6 驱动，支持工具调用）

- **Hero Showcase**: Auto-rotating carousel of featured Mobile Suits, with faction-themed colors and dynamic backgrounds.
  （英雄展示台：主页自动轮播精选 MS）

## Tech Stack · 技术栈

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+ / FastAPI |
| AI | Anthropic Claude claude-sonnet-4-6 |
| Frontend | Vanilla HTML + CSS + JavaScript |
| HTTP Client | httpx (async) |
| Server | Uvicorn |

## Project Structure · 项目结构

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

## Quick Start · 快速启动

### 1. Install Dependencies · 安装依赖

```bash
pip install fastapi uvicorn httpx anthropic
```

### 2. Set API Key · 设置 API Key

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Start Server · 启动服务

```bash
cd /path/to/Gundam
python main.py
```

Visit [http://localhost:8000](http://localhost:8000)

## API Endpoints · API 端点

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Frontend homepage |
| GET | `/api/ms` | MS list (filters: `universe`, `faction_side`, `q`) |
| GET | `/api/ms/{ms_id}` | Single MS details |
| GET | `/api/timeline` | War timeline (filter: `universe`) |
| GET | `/api/img?url=...` | Image reverse proxy (bypass Gundam Wiki hotlink protection) |
| POST | `/api/chat` | AI Q&A with tool calling |
| POST | `/api/commentary` | Generate AI deep commentary for a specified MS |

## AI Tools · AI 工具

ALICE can automatically invoke the following tools when responding:

- `get_ms_details` — Query detailed specs of a specified MS
- `search_ms` — Search MS by keyword or universe
- `compare_ms` — Compare stats of two MS units
- `get_war_info` — Query war or historical event info
- `list_all_ms` — List all MS units

## MS Database · 收录机体

| Universe | Mobile Suits |
|----------|--------------|
| UC | RX-78-2 Gundam, MS-06S Zaku II Commander Type, MSZ-006 Zeta Gundam, RX-93 ν Gundam, MSN-04 Sazabi, RX-0 Unicorn Gundam, AMX-004 Qubeley, MSN-02 Zeong |
| AC | XXXG-01W Wing Gundam, XXXG-00W0 Wing Gundam Zero |
| CE | GAT-X105 Strike Gundam, ZGMF-X10A Freedom Gundam, ZGMF-X20A Destiny Gundam |
| AD | GN-001 Exia, GN-0000 00 Gundam |
| PD | ASW-G-08 Gundam Barbatos, XVX-016 Gundam Aerial, STH-20 Hekija |
