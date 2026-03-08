/* ── 状态 ────────────────────────────────────────────────── */
let msData = [];
let chatHistory = [];

// ── 英雄展示区 ──────────────────────────────────────────────
const HERO_MS = ['rx-78-2', 'msn-04', 'rx-93', 'msz-006', 'rx-0', 'xxxg-01w', 'asw-g-08', 'zgmf-x10a'];
let heroIndex = 0;
let heroTimer = null;
let heroProgress = 0;
let heroProgressTimer = null;
let currentHeroId = HERO_MS[0];
const HERO_INTERVAL = 6000;

function initHero(allMS) {
  const featured = HERO_MS.map(id => allMS.find(m => m.id === id)).filter(Boolean);
  if (!featured.length) return;

  // 点状导航
  const dotsEl = $('hero-dots');
  dotsEl.innerHTML = featured.map((_, i) =>
    `<div class="hero-dot${i === 0 ? ' active' : ''}" onclick="goHero(${i})"></div>`
  ).join('');

  $('hero-prev').addEventListener('click', () => goHero((heroIndex - 1 + featured.length) % featured.length));
  $('hero-next').addEventListener('click', () => goHero((heroIndex + 1) % featured.length));

  $('hero-chat-btn').addEventListener('click', () => {
    const ms = featured[heroIndex];
    document.querySelector('[data-tab="chat"]').click();
    sendMessage(`请用ALICE的风格，深度介绍 ${ms.name_zh}（${ms.model_number}）这台机体。`);
  });

  showHero(featured, 0);
  startHeroAuto(featured);
}

function showHero(featured, idx) {
  const ms = featured[idx];
  heroIndex = idx;
  currentHeroId = ms.id;

  // 更新颜色主题
  const col = ms.color || '#4a90d9';
  $('hero-bg').style.background =
    `radial-gradient(ellipse at 70% 50%, ${col}25 0%, transparent 65%),
     linear-gradient(180deg, #080c14 0%, #0c1220 100%)`;
  $('hero-img-glow').style.background =
    `radial-gradient(ellipse, ${col}66, transparent 70%)`;

  // 文字
  $('hero-model').textContent = ms.model_number;
  $('hero-name-zh').textContent = ms.name_zh;
  $('hero-desc').textContent = ms.description || '';

  // 标签
  const tagColor = { federation: '#3a7bd5', zeon: '#cc3300', aeug: '#ff8800', neutral: '#44aa66' };
  $('hero-tags').innerHTML = `
    <span class="hero-tag" style="color:${col};border-color:${col}44">${ms.universe}</span>
    <span class="hero-tag" style="color:${tagColor[ms.faction_side]||col};border-color:${tagColor[ms.faction_side]||col}44">${ms.faction}</span>
    <span class="hero-tag" style="color:#aaa;border-color:#333">${ms.era}</span>
  `;

  // 图片（带渐变效果）
  const imgEl = $('hero-img');
  imgEl.style.opacity = '0';
  imgEl.src = imgSrc(ms.image_url);
  imgEl.alt = ms.name_zh;
  imgEl.onload = () => { imgEl.style.transition = 'opacity 0.5s'; imgEl.style.opacity = '1'; };
  imgEl.onerror = () => { imgEl.style.opacity = '0'; };

  // 点状导航高亮
  document.querySelectorAll('.hero-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });

  // 重置进度条
  resetHeroProgress();
}

function goHero(idx) {
  const featured = HERO_MS.map(id => msData.find(m => m.id === id)).filter(Boolean);
  showHero(featured, idx);
  restartHeroAuto(featured);
}

function startHeroAuto(featured) {
  heroProgressTimer = setInterval(() => {
    heroProgress += 100 / (HERO_INTERVAL / 100);
    const fill = $('hero-progress');
    if (fill) fill.style.width = Math.min(heroProgress, 100) + '%';
    if (heroProgress >= 100) {
      heroProgress = 0;
      const next = (heroIndex + 1) % featured.length;
      showHero(featured, next);
    }
  }, 100);
}

function restartHeroAuto(featured) {
  clearInterval(heroProgressTimer);
  heroProgress = 0;
  startHeroAuto(featured);
}

function resetHeroProgress() {
  heroProgress = 0;
  const fill = $('hero-progress');
  if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
}

/* ── 工具函数 ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const factionTag = side => ({ federation: 'fed', zeon: 'zeon', aeug: 'aeug', neutral: 'neutral' }[side] || 'neutral');
const universeTag = u => u.toLowerCase();
// 图片走后端代理（绕过防盗链）
const imgSrc = url => url ? `/api/img?url=${encodeURIComponent(url)}` : '';

/* ── 标签页切换 ───────────────────────────────────────────── */
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ════════════════════════════════════════════════════════════
   MS 图鉴
   ════════════════════════════════════════════════════════════ */
async function loadMS() {
  const universe = $('filter-universe').value;
  const faction = $('filter-faction').value;
  const q = $('search-input').value.trim();

  const params = new URLSearchParams();
  if (universe) params.set('universe', universe);
  if (faction) params.set('faction_side', faction);
  if (q) params.set('q', q);

  try {
    const res = await fetch('/api/ms?' + params.toString());
    msData = await res.json();
    renderMSGrid(msData);
    // 首次加载时初始化英雄展示
    if (!heroTimer && msData.length) initHero(msData);
  } catch (e) {
    $('ms-grid').innerHTML = '<div class="loading-msg" style="color:#ff3344">数据加载失败，请确认后端已启动</div>';
  }
}

function renderMSGrid(list) {
  const grid = $('ms-grid');
  if (!list.length) {
    grid.innerHTML = '<div class="loading-msg">未找到匹配的MS</div>';
    return;
  }
  grid.innerHTML = list.map(ms => `
    <div class="ms-card" onclick="openMSModal('${ms.id}')">
      <div class="ms-card-top" style="background: linear-gradient(135deg, ${ms.color}22, ${ms.color}66);">
        ${ms.image_url
          ? `<img class="ms-card-img" src="${imgSrc(ms.image_url)}" alt="${ms.name_zh}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
          : ''}
        <div class="ms-model-display" style="${ms.image_url ? 'display:none' : ''}">${ms.model_number}</div>
        <div class="ms-faction-stripe" style="background: ${ms.color};"></div>
      </div>
      <div class="ms-card-body">
        <div class="ms-name-zh">${ms.name_zh}</div>
        <div class="ms-meta">
          <span class="ms-tag tag-${universeTag(ms.universe)}">${ms.universe}</span>
          <span class="ms-tag tag-${factionTag(ms.faction_side)}">${ms.faction}</span>
        </div>
        <div class="ms-pilot">驾驶员：<span>${ms.pilot.join(' / ')}</span></div>
      </div>
      <div class="ms-card-footer">
        <span class="ms-era">${ms.era}</span>
        <button class="ms-detail-btn">查看详情 →</button>
      </div>
    </div>
  `).join('');
}

// 过滤监听
$('search-input').addEventListener('input', debounce(loadMS, 300));
$('filter-universe').addEventListener('change', loadMS);
$('filter-faction').addEventListener('change', loadMS);

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ════════════════════════════════════════════════════════════
   MS 详情模态框
   ════════════════════════════════════════════════════════════ */
async function openMSModal(msId) {
  const modal = $('ms-modal');
  const body = $('modal-body');
  modal.classList.remove('hidden');
  body.innerHTML = '<div style="padding:60px;text-align:center;color:var(--text-dim)">载入中...</div>';

  try {
    const res = await fetch(`/api/ms/${msId}`);
    const ms = await res.json();
    renderMSModal(ms);
  } catch (e) {
    body.innerHTML = '<div style="padding:40px;color:var(--red)">加载失败</div>';
  }
}

function renderMSModal(ms) {
  const body = $('modal-body');
  const fColor = ms.color || '#3a7bd5';

  body.innerHTML = `
    <div class="modal-hero" style="background: linear-gradient(135deg, ${fColor}44, ${fColor}11);">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%, ${fColor}22, transparent 70%);"></div>
      ${ms.image_url ? `<img class="modal-hero-img" src="${imgSrc(ms.image_url)}" alt="${ms.name_zh}" onerror="this.style.display='none'" />` : ''}
      <div class="modal-hero-text">
        <div class="modal-model">${ms.model_number}</div>
        <div class="modal-name-zh">${ms.name_zh}</div>
      </div>
    </div>

    <div class="modal-body-inner">
      <!-- 基础信息 -->
      <div class="modal-section">
        <div class="modal-section-title">基础规格</div>
        <div class="specs-grid">
          <div class="spec-item"><div class="spec-label">系列</div><div class="spec-value">${ms.series}</div></div>
          <div class="spec-item"><div class="spec-label">宇宙/年代</div><div class="spec-value">${ms.universe} · ${ms.era}</div></div>
          <div class="spec-item"><div class="spec-label">阵营</div><div class="spec-value">${ms.faction}</div></div>
          <div class="spec-item"><div class="spec-label">全高</div><div class="spec-value">${ms.height}</div></div>
          <div class="spec-item"><div class="spec-label">重量</div><div class="spec-value">${ms.weight}</div></div>
          <div class="spec-item"><div class="spec-label">动力</div><div class="spec-value" style="font-size:12px">${ms.power_source}</div></div>
        </div>
      </div>

      <!-- 驾驶员 -->
      <div class="modal-section">
        <div class="modal-section-title">驾驶员</div>
        <div>${ms.pilot.map(p => `<span class="pilot-tag">${p}</span>`).join('')}</div>
      </div>

      <!-- 武装 -->
      <div class="modal-section">
        <div class="modal-section-title">武装配置</div>
        <div class="weapons-list">${ms.weapons.map(w => `<span class="weapon-item">${w}</span>`).join('')}</div>
      </div>

      <!-- 机体描述 -->
      <div class="modal-section">
        <div class="modal-section-title">机体介绍</div>
        <div class="modal-text">${ms.description}</div>
      </div>

      <!-- 历史意义 -->
      <div class="modal-section">
        <div class="modal-section-title">历史意义</div>
        <div class="modal-text">${ms.significance}</div>
      </div>

      <!-- ALICE 解说 -->
      <div class="modal-section">
        <div class="modal-section-title">ALICE 深度解说</div>
        <div id="commentary-area">
          <button class="commentary-btn" onclick="loadCommentary('${ms.id}')">
            ▶ 生成 ALICE 深度解说
          </button>
        </div>
      </div>

      <div style="font-size:11px;color:var(--text-dim);padding-top:8px;border-top:1px solid var(--border)">
        首次登场：${ms.first_appearance}
      </div>
    </div>
  `;
}

async function loadCommentary(msId) {
  const area = $('commentary-area');
  area.innerHTML = '<div class="commentary-block"><span class="commentary-loading">ALICE 正在分析中，请稍候...</span></div>';

  try {
    const res = await fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ms_id: msId })
    });
    const data = await res.json();
    area.innerHTML = `<div class="commentary-block">${escapeHtml(data.commentary)}</div>`;
  } catch (e) {
    area.innerHTML = '<div class="commentary-block" style="color:var(--red)">生成失败，请确认 API Key 已设置</div>';
  }
}

// 关闭模态框
$('modal-close').addEventListener('click', () => $('ms-modal').classList.add('hidden'));
$('modal-backdrop').addEventListener('click', () => $('ms-modal').classList.add('hidden'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('ms-modal').classList.add('hidden'); });

/* ════════════════════════════════════════════════════════════
   战争年表
   ════════════════════════════════════════════════════════════ */
async function loadTimeline() {
  const universe = $('timeline-universe').value;
  const params = universe ? `?universe=${universe}` : '';

  try {
    const res = await fetch('/api/timeline' + params);
    const data = await res.json();
    renderTimeline(data);
  } catch (e) {
    $('timeline-list').innerHTML = '<div class="loading-msg" style="color:#ff3344">加载失败</div>';
  }
}

function renderTimeline(events) {
  const list = $('timeline-list');
  list.innerHTML = events.map(ev => `
    <div class="timeline-item">
      <div class="timeline-era">${ev.era}</div>
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-title">${ev.title}</div>
        <span class="timeline-type type-${ev.type}">${typeLabel(ev.type)}</span>
        <div class="timeline-desc">${ev.description}</div>
        ${ev.key_ms.length ? `
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;letter-spacing:1px">相关机体：</div>
          <div class="timeline-ms">
            ${ev.key_ms.map(ms => `<span class="timeline-ms-tag" onclick="searchByMS('${ms}')">${ms}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function typeLabel(t) {
  return { war: '战争', battle: '战役', political: '政治事件', milestone: '里程碑' }[t] || t;
}

$('timeline-universe').addEventListener('change', loadTimeline);

// 点击年表 MS 标签跳转到图鉴并搜索
function searchByMS(msName) {
  document.querySelector('[data-tab="hangar"]').click();
  $('search-input').value = msName;
  loadMS();
}

/* ════════════════════════════════════════════════════════════
   AI 问答
   ════════════════════════════════════════════════════════════ */
async function sendMessage(text) {
  if (!text.trim()) return;
  const sendBtn = $('send-btn');
  const input = $('chat-input');

  // 添加用户消息
  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  sendBtn.disabled = true;

  // 添加思考中占位
  const thinkId = 'think-' + Date.now();
  appendMessage('alice', 'ALICE 正在分析...', thinkId, true);

  // 隐藏工具日志
  const toolLog = $('tool-log');
  toolLog.classList.add('hidden');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    const data = await res.json();

    // 移除思考占位，添加真实回答
    removeMessage(thinkId);
    appendMessage('alice', data.reply);
    chatHistory.push({ role: 'assistant', content: data.reply });

    // 显示工具调用日志
    if (data.tools_used && data.tools_used.length > 0) {
      toolLog.innerHTML = `
        <div class="tool-log-title">▶ AGENT 工具调用记录</div>
        ${data.tools_used.map(t => `<div>• ${escapeHtml(t)}</div>`).join('')}
      `;
      toolLog.classList.remove('hidden');
    }
  } catch (e) {
    removeMessage(thinkId);
    appendMessage('alice', '连接失败，请确认后端服务已启动（python main.py）');
  }

  sendBtn.disabled = false;
}

function appendMessage(role, text, id, thinking = false) {
  const messages = $('chat-messages');
  const div = document.createElement('div');
  div.className = role === 'user' ? 'msg-user' : ('msg-alice' + (thinking ? ' msg-thinking' : ''));
  if (id) div.id = id;
  div.innerHTML = `<div class="msg-bubble">${role === 'alice' ? escapeHtml(text) : escapeHtml(text)}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeMessage(id) {
  const el = $(id);
  if (el) el.remove();
}

// 发送按钮
$('send-btn').addEventListener('click', () => sendMessage($('chat-input').value));
$('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage($('chat-input').value); }
});

// 快速提问
document.querySelectorAll('.quick-q').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('[data-tab="chat"]').click();
    sendMessage(btn.dataset.q);
  });
});

/* ════════════════════════════════════════════════════════════
   工具函数
   ════════════════════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

/* ── 初始化 ───────────────────────────────────────────────── */
loadMS();
loadTimeline();
