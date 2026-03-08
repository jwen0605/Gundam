import os
import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, Response
from pydantic import BaseModel
import httpx
import anthropic

# ── 初始化 ──────────────────────────────────────────────
app = FastAPI(title="高达指挥中心")
app.mount("/static", StaticFiles(directory="static"), name="static")

# 加载数据库
DATA_DIR = Path("data")
with open(DATA_DIR / "ms_database.json", encoding="utf-8") as f:
    MS_DB: list[dict] = json.load(f)
with open(DATA_DIR / "timeline.json", encoding="utf-8") as f:
    TIMELINE: list[dict] = json.load(f)

MS_INDEX = {ms["id"]: ms for ms in MS_DB}

# Anthropic 客户端
api_key = os.environ.get("ANTHROPIC_API_KEY", "")
client = anthropic.Anthropic(api_key=api_key) if api_key else None

SYSTEM_PROMPT = """你是一位深度高达宇宙专家AI，代号"ALICE"（Advanced Logistic & Intelligence Command Engine）。
你拥有关于整个高达系列的全面知识，包括宇宙世纪(UC)、改历(AC)、宇宙世纪时代(CE)、先进世纪(AD)、正历(PD)等所有宇宙。

你的风格：
- 专业而充满热情，像真正的MS分析师和历史学家
- 回答时结合机体性能、战斗历史、驾驶员背景综合分析
- 偶尔使用高达宇宙内的专业术语，但会适当解释
- 对MS的评价兼顾战斗性能、历史地位和文化影响
- 用中文回答

你可以调用工具查询MS数据库和战争年表来辅助回答。"""

# ── 工具定义 ────────────────────────────────────────────
TOOLS = [
    {
        "name": "get_ms_details",
        "description": "获取指定MS型号的详细规格和历史信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "ms_id": {
                    "type": "string",
                    "description": "MS的ID，例如 'rx-78-2', 'msn-04'，或者MS的中文/英文名称关键词"
                }
            },
            "required": ["ms_id"]
        }
    },
    {
        "name": "search_ms",
        "description": "根据关键词搜索MS，可按系列、阵营、驾驶员、型号等搜索",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词，例如'吉翁'、'新人类'、'阿姆罗'、'UC'"
                },
                "universe": {
                    "type": "string",
                    "description": "限定宇宙类型：UC / AC / CE / AD / PD，不指定则全部搜索"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "compare_ms",
        "description": "对比两台MS的规格参数",
        "input_schema": {
            "type": "object",
            "properties": {
                "ms1_id": {"type": "string", "description": "第一台MS的ID或名称"},
                "ms2_id": {"type": "string", "description": "第二台MS的ID或名称"}
            },
            "required": ["ms1_id", "ms2_id"]
        }
    },
    {
        "name": "get_war_info",
        "description": "获取某场战争或重大历史事件的详细信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "war_name": {
                    "type": "string",
                    "description": "战争或事件名称，例如'一年战争'、'格里普斯战役'、'阿克西斯战争'"
                }
            },
            "required": ["war_name"]
        }
    },
    {
        "name": "list_all_ms",
        "description": "列出数据库中所有MS型号的简要信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "universe": {
                    "type": "string",
                    "description": "可选：按宇宙筛选 UC / AC / CE / AD / PD"
                }
            }
        }
    }
]


# ── 工具执行函数 ─────────────────────────────────────────
def _find_ms(query: str) -> Optional[dict]:
    """模糊查找 MS"""
    q = query.lower().strip()
    # 精确 ID 匹配
    if q in MS_INDEX:
        return MS_INDEX[q]
    # 名称 / 型号模糊匹配
    for ms in MS_DB:
        if (q in ms["name_zh"].lower() or
                q in ms["name_en"].lower() or
                q in ms["model_number"].lower() or
                q in ms["id"].lower()):
            return ms
    return None


def execute_tool(tool_name: str, tool_input: dict) -> str:
    if tool_name == "get_ms_details":
        ms = _find_ms(tool_input["ms_id"])
        if not ms:
            return f"未找到MS：{tool_input['ms_id']}"
        return json.dumps(ms, ensure_ascii=False, indent=2)

    elif tool_name == "search_ms":
        q = tool_input["query"].lower()
        universe_filter = tool_input.get("universe", "").upper()
        results = []
        for ms in MS_DB:
            if universe_filter and ms["universe"] != universe_filter:
                continue
            searchable = json.dumps(ms, ensure_ascii=False).lower()
            if q in searchable:
                results.append({
                    "id": ms["id"],
                    "name_zh": ms["name_zh"],
                    "model_number": ms["model_number"],
                    "series": ms["series"],
                    "era": ms["era"],
                    "faction": ms["faction"],
                    "pilot": ms["pilot"]
                })
        if not results:
            return f"未找到包含'{tool_input['query']}'的MS"
        return json.dumps(results, ensure_ascii=False, indent=2)

    elif tool_name == "compare_ms":
        ms1 = _find_ms(tool_input["ms1_id"])
        ms2 = _find_ms(tool_input["ms2_id"])
        if not ms1:
            return f"未找到MS：{tool_input['ms1_id']}"
        if not ms2:
            return f"未找到MS：{tool_input['ms2_id']}"
        return json.dumps({"ms1": ms1, "ms2": ms2}, ensure_ascii=False, indent=2)

    elif tool_name == "get_war_info":
        q = tool_input["war_name"].lower()
        results = []
        for event in TIMELINE:
            if (q in event["title"].lower() or
                    q in event["description"].lower() or
                    q in event["id"].lower()):
                results.append(event)
        if not results:
            return f"未找到关于'{tool_input['war_name']}'的记录"
        return json.dumps(results, ensure_ascii=False, indent=2)

    elif tool_name == "list_all_ms":
        universe_filter = tool_input.get("universe", "").upper()
        results = []
        for ms in MS_DB:
            if universe_filter and ms["universe"] != universe_filter:
                continue
            results.append({
                "id": ms["id"],
                "name_zh": ms["name_zh"],
                "model_number": ms["model_number"],
                "era": ms["era"],
                "faction": ms["faction"]
            })
        return json.dumps(results, ensure_ascii=False, indent=2)

    return f"未知工具：{tool_name}"


# ── Agentic 对话循环 ──────────────────────────────────────
def agentic_chat(messages: list[dict]) -> str:
    """带工具调用的 Agent 对话，最多迭代 6 次"""
    if not client:
        return "错误：未设置 ANTHROPIC_API_KEY 环境变量。请在终端运行：export ANTHROPIC_API_KEY=你的密钥"

    conversation = list(messages)
    tool_calls_log = []

    for _ in range(6):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=conversation
        )

        # 收集文本和工具调用
        text_parts = []
        tool_uses = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_uses.append(block)

        # 如果没有工具调用，返回最终回答
        if response.stop_reason == "end_turn" or not tool_uses:
            final_text = "\n".join(text_parts)
            if tool_calls_log:
                log_str = "\n".join([f"• {t}" for t in tool_calls_log])
                return f"<tool_log>{log_str}</tool_log>\n{final_text}"
            return final_text

        # 执行工具调用
        conversation.append({"role": "assistant", "content": response.content})
        tool_results = []
        for tool_use in tool_uses:
            tool_calls_log.append(f"调用工具：{tool_use.name}({json.dumps(tool_use.input, ensure_ascii=False)})")
            result = execute_tool(tool_use.name, tool_use.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": result
            })
        conversation.append({"role": "user", "content": tool_results})

    return "（已达到最大迭代次数）" + "\n".join(text_parts) if text_parts else "处理超时，请重试。"


# ── API 路由 ──────────────────────────────────────────────
@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/api/img")
async def image_proxy(url: str):
    """代理图片请求，绕过防盗链"""
    if "wikia.nocookie.net" not in url and "static.wikia" not in url:
        raise HTTPException(status_code=400, detail="仅支持 Gundam Wiki 图片代理")
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "Referer": "https://gundam.fandom.com/",
                "User-Agent": "Mozilla/5.0 (compatible; GundamWiki reader)"
            })
        content_type = resp.headers.get("content-type", "image/jpeg")
        return Response(content=resp.content, media_type=content_type,
                        headers={"Cache-Control": "public, max-age=86400"})
    except Exception:
        raise HTTPException(status_code=502, detail="图片加载失败")


@app.get("/api/ms")
async def list_ms(universe: str = "", faction_side: str = "", q: str = ""):
    results = MS_DB
    if universe:
        results = [m for m in results if m["universe"].upper() == universe.upper()]
    if faction_side:
        results = [m for m in results if m["faction_side"] == faction_side]
    if q:
        ql = q.lower()
        results = [m for m in results if
                   ql in m["name_zh"].lower() or
                   ql in m["name_en"].lower() or
                   ql in m["model_number"].lower() or
                   ql in m["faction"].lower()]
    # 返回列表摘要（不含长文字段）
    summary = []
    for m in results:
        summary.append({
            "id": m["id"],
            "name_zh": m["name_zh"],
            "name_en": m["name_en"],
            "model_number": m["model_number"],
            "series": m["series"],
            "universe": m["universe"],
            "era": m["era"],
            "faction": m["faction"],
            "faction_side": m["faction_side"],
            "pilot": m["pilot"],
            "color": m["color"],
            "image_url": m.get("image_url", "")
        })
    return summary


@app.get("/api/ms/{ms_id}")
async def get_ms(ms_id: str):
    if ms_id not in MS_INDEX:
        raise HTTPException(status_code=404, detail="未找到该MS")
    return MS_INDEX[ms_id]


@app.get("/api/timeline")
async def get_timeline(universe: str = ""):
    if universe:
        return [e for e in TIMELINE if e["universe"].upper() == universe.upper()]
    return TIMELINE


class ChatRequest(BaseModel):
    messages: list[dict]


class CommentaryRequest(BaseModel):
    ms_id: str


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not client:
        return {"reply": "错误：未设置 ANTHROPIC_API_KEY。请在启动前运行：\nexport ANTHROPIC_API_KEY=你的密钥", "tools_used": []}
    reply = agentic_chat(req.messages)
    # 提取工具日志
    tools_used = []
    if "<tool_log>" in reply:
        import re
        log_match = re.search(r"<tool_log>(.*?)</tool_log>", reply, re.DOTALL)
        if log_match:
            tools_used = [line.strip("• ").strip() for line in log_match.group(1).strip().split("\n") if line.strip()]
            reply = reply.replace(log_match.group(0), "").strip()
    return {"reply": reply, "tools_used": tools_used}


@app.post("/api/commentary")
async def ms_commentary(req: CommentaryRequest):
    if not client:
        return {"commentary": "错误：未设置 ANTHROPIC_API_KEY"}
    if req.ms_id not in MS_INDEX:
        raise HTTPException(status_code=404, detail="未找到该MS")
    ms = MS_INDEX[req.ms_id]
    prompt = f"""请以ALICE指挥中心AI的身份，为以下MS撰写一段深度解说（约200-300字）：

机体：{ms['name_zh']}（{ms['model_number']}）
时代：{ms['era']}
阵营：{ms['faction']}
驾驶员：{', '.join(ms['pilot'])}
描述：{ms['description']}
历史意义：{ms['significance']}

请从【战场表现】【技术革新】【历史意义】三个角度简要分析，语言生动有力，充满战场气息。"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return {"commentary": response.content[0].text}


if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("  高达指挥中心 ALICE 系统启动中...")
    print("=" * 50)
    if not api_key:
        print("⚠  警告：未检测到 ANTHROPIC_API_KEY")
        print("   请运行：export ANTHROPIC_API_KEY=你的密钥")
        print("   然后重新启动服务")
    else:
        print("✓  ANTHROPIC_API_KEY 已载入")
    print("✓  MS数据库已加载：%d 台机体" % len(MS_DB))
    print("✓  战争年表已加载：%d 个事件" % len(TIMELINE))
    print("  访问地址：http://localhost:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
