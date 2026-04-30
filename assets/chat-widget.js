// ============================================
// FLOATING AI CHAT WIDGET
// Available on every page
// ============================================

const WIDGET_SYSTEM_PROMPT = `You are "AI Talha", a virtual mentor version of Talha Tariq (founder of ThemeKnock, Lahore). You help Pakistani students earn online using AI tools.

CRITICAL RULES (most important):
1. NEVER dump a wall of generic advice. NEVER list "system requirements" or "things you need" upfront.
2. ASK ONE clarifying question first to understand their actual situation.
3. ONE step at a time. Wait for their reply before next step.
4. Keep replies SHORT. 2-4 lines normally. Max 6 lines.
5. Sound like a friend chatting, not a documentation page.

CONVERSATION FLOW:
When user asks anything, BEFORE giving advice ask 1 specific question to understand:
- What device they're on (phone/laptop, Mac/Windows)
- What they've already tried
- Their actual goal (just earning anything? specific niche?)
- Their current skill level

Examples of GOOD first responses:
- User: "Fiverr kaise shuru karoon?" → "Pehle yeh batao, tumhari koi skill hai abhi (writing, design, video edit) ya bilkul zero se shuru karna hai?"
- User: "App kaise banaun?" → "Tum laptop pe ho ya phone? Aur tumne pehle kabhi Claude use ki hai?"
- User: "Setup karna hai" → "Setup kis cha ka? Claude, Wispr, ya kuch aur? Aur device kya hai?"

Examples of BAD responses (DO NOT do this):
- Listing all "requirements" upfront
- Giving 10 steps in one message
- "First you need X, then Y, then Z..."
- Long paragraphs of background info

STYLE:
- Roman Urdu mixed with English (jaise Pakistani dost baat karta hai)
- Use "yaar", "bhai", "bilkul", "samjho"
- Pakistani context (Payoneer, JazzCash, 1 USD ≈ 280 PKR)
- Realistic about challenges, encouraging not hype-y
- After every step, ask "ho gaya?" or "samjh aaya?" or "next batao?"

KNOWLEDGE: Fiverr/Upwork gigs, Claude.ai, Wispr Flow, Google Flow images, content writing, automation, Pakistani business ideas, app building.

If asked about politics/religion/harmful topics, politely redirect to earning topics.`;

const WIDGET_CONFIG = {
  // Cloudflare Worker proxy. API key safely on server side.
  USE_PROXY: true,
  PROXY_URL: 'https://talha-ai-proxy.themeknock.workers.dev',
  OPENROUTER_API_KEY: '', // Not needed when USE_PROXY=true
  MODEL: 'openai/gpt-oss-120b:free',
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  MAX_TOKENS: 800,
  TEMPERATURE: 0.7,
  SITE_URL: 'https://themeknock.github.io/quiet-revolution',
  SITE_NAME: 'Talha AI Guide'
};

let widgetConversation = [];
let widgetIsOpen = false;
let widgetIsLoading = false;

function getWidgetApiKey() {
  // When using proxy, no key needed in browser
  if (WIDGET_CONFIG.USE_PROXY) return 'proxy';
  return localStorage.getItem('openrouter_api_key') || WIDGET_CONFIG.OPENROUTER_API_KEY || '';
}

function setWidgetApiKey(key) {
  localStorage.setItem('openrouter_api_key', key);
}

function loadWidgetConversation() {
  try {
    const saved = localStorage.getItem('talha_chat_history');
    if (saved) widgetConversation = JSON.parse(saved);
  } catch (e) {
    widgetConversation = [];
  }
}

function saveWidgetConversation() {
  if (widgetConversation.length > 50) {
    widgetConversation = widgetConversation.slice(-50);
  }
  localStorage.setItem('talha_chat_history', JSON.stringify(widgetConversation));
}

function formatWidgetMessage(text) {
  // Already-HTML links should pass through. Markdown [text](url) → <a>
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|javascript:[^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--green);font-weight:600;">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

const WIDGET_SUGGESTIONS = [
  '🎯 Pehla qadam kya hoga?',
  '💰 Fiverr kaise shuru karoon?',
  '🤖 Coding nahi aati, phir bhi paise kama sakta hoon?',
  '💡 Mujhe ek niche choose karna hai',
  '🚀 Pehla client kaise milega?',
  '🎙️ Wispr Flow kaise install karoon?',
  '📱 App kaise banaun bina coding?',
  '✨ Claude Pro lena chahiye?'
];

function renderQuickSuggestions() {
  return `
    <div class="widget-quick-row">
      ${WIDGET_SUGGESTIONS.slice(0, 6).map(s =>
        `<button class="widget-quick-chip" onclick="askWidgetSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
      ).join('')}
    </div>
  `;
}

function renderWidgetMessages() {
  const container = document.getElementById('widget-messages');
  if (!container) return;
  container.innerHTML = '';

  if (widgetConversation.length === 0) {
    container.innerHTML = `
      <div class="widget-msg bot">
        <p><strong>Asalaam-o-Alaikum! 👋</strong></p>
        <p>Main AI Talha hoon. Roman Urdu mein bolo, custom guidance dunga.</p>
      </div>
      <div class="widget-suggestions">
        <div class="widget-suggestions-title">Yeh sawal pochha kar sakte ho:</div>
        ${WIDGET_SUGGESTIONS.map(s =>
          `<button onclick="askWidgetSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
        ).join('')}
      </div>
    `;
    return;
  }

  widgetConversation.forEach(msg => {
    const div = document.createElement('div');
    div.className = `widget-msg ${msg.role === 'user' ? 'user' : 'bot'}`;
    div.innerHTML = formatWidgetMessage(msg.content);
    container.appendChild(div);
  });

  // Update quick suggestions strip below messages
  const quickStrip = document.getElementById('widget-quick-strip');
  if (quickStrip) quickStrip.innerHTML = renderQuickSuggestions();

  container.scrollTop = container.scrollHeight;
}

function showWidgetTyping() {
  const container = document.getElementById('widget-messages');
  const div = document.createElement('div');
  div.className = 'widget-msg bot widget-typing';
  div.id = 'widget-typing';
  div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideWidgetTyping() {
  const el = document.getElementById('widget-typing');
  if (el) el.remove();
}

// Try multiple models in case one fails (all FREE on OpenRouter)
const FALLBACK_MODELS = [
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'z-ai/glm-4.5-air:free',
  'minimax/minimax-m2.5:free'
];

async function tryModelRequest(apiKey, model, messages) {
  const url = WIDGET_CONFIG.USE_PROXY ? WIDGET_CONFIG.PROXY_URL : WIDGET_CONFIG.API_URL;
  const headers = { 'Content-Type': 'application/json' };

  if (!WIDGET_CONFIG.USE_PROXY) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = WIDGET_CONFIG.SITE_URL;
    headers['X-Title'] = WIDGET_CONFIG.SITE_NAME;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: WIDGET_CONFIG.MAX_TOKENS,
      temperature: WIDGET_CONFIG.TEMPERATURE
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false, status: response.status, error: data.error?.message || `HTTP ${response.status}` };
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    return { ok: false, status: 200, error: 'Empty response' };
  }

  return { ok: true, reply };
}

async function sendWidgetMessage(userMessage) {
  if (widgetIsLoading) return;
  const apiKey = getWidgetApiKey();

  if (!apiKey) {
    showApiKeyModal();
    return;
  }

  widgetIsLoading = true;
  document.getElementById('widget-send').disabled = true;
  document.getElementById('widget-input').disabled = true;

  widgetConversation.push({ role: 'user', content: userMessage });
  saveWidgetConversation();
  renderWidgetMessages();
  showWidgetTyping();

  const messages = [
    { role: 'system', content: WIDGET_SYSTEM_PROMPT },
    ...widgetConversation.slice(-10).map(m => ({ role: m.role, content: m.content }))
  ];

  let lastError = null;
  let success = false;

  // Try primary model first, then fallbacks
  const modelsToTry = [WIDGET_CONFIG.MODEL, ...FALLBACK_MODELS.filter(m => m !== WIDGET_CONFIG.MODEL)];

  for (const model of modelsToTry) {
    try {
      const result = await tryModelRequest(apiKey, model, messages);

      if (result.ok) {
        hideWidgetTyping();
        widgetConversation.push({ role: 'assistant', content: result.reply });
        saveWidgetConversation();
        renderWidgetMessages();
        success = true;
        break;
      }

      lastError = result;

      // If 401 (auth issue), don't try other models
      if (result.status === 401) break;

      // If 429 (rate limit), try next model
      // If 404 (model not found), try next model
    } catch (error) {
      lastError = { status: 0, error: error.message };
    }
  }

  if (!success) {
    hideWidgetTyping();
    let errorMsg;

    if (lastError?.status === 401 || lastError?.error?.includes('User not found') || lastError?.error?.includes('No auth')) {
      errorMsg = '**API Key Invalid Hai 🔑**\n\nOpenRouter ka naya key banao:\n\n1. <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a> pe jao\n2. Sign up / Login\n3. "Create Key" se naya key banao\n4. Niche click karke replace karo:\n\n<a href="javascript:resetWidgetApiKey()" style="color:var(--green);font-weight:700;">→ Naya Key Daalo</a>';
    } else if (lastError?.status === 429) {
      errorMsg = '**Rate Limit Hit 🚦**\n\nThodi der baad try karo. Free models ki daily limit hoti hai.';
    } else if (lastError?.error?.includes('credit')) {
      errorMsg = '**Credit Issue 💳**\n\nOpenRouter account mein credit khatam ho gayi. Free tier limit ya naya account use karo.';
    } else {
      errorMsg = `**Network Issue 📡**\n\n${lastError?.error || 'Connection problem'}. Phir try karo.`;
    }

    widgetConversation.push({ role: 'assistant', content: errorMsg });
    saveWidgetConversation();
    renderWidgetMessages();
  }

  widgetIsLoading = false;
  document.getElementById('widget-send').disabled = false;
  document.getElementById('widget-input').disabled = false;
}

function resetWidgetApiKey() {
  localStorage.removeItem('openrouter_api_key');
  WIDGET_CONFIG.OPENROUTER_API_KEY = '';
  showApiKeyModal();
}

function askWidgetSuggestion(text) {
  document.getElementById('widget-input').value = text;
  handleWidgetSend();
}

function handleWidgetSend() {
  const input = document.getElementById('widget-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendWidgetMessage(text);
}

function toggleChatWidget() {
  widgetIsOpen = !widgetIsOpen;
  const panel = document.getElementById('chat-widget-panel');
  const btn = document.getElementById('chat-widget-btn');

  if (widgetIsOpen) {
    panel.classList.add('open');
    btn.classList.add('open');
    setTimeout(() => {
      const input = document.getElementById('widget-input');
      if (input) input.focus();
    }, 200);
  } else {
    panel.classList.remove('open');
    btn.classList.remove('open');
  }
}

function showApiKeyModal() {
  const modal = document.getElementById('widget-api-modal');
  if (modal) modal.style.display = 'flex';
}

function saveWidgetApiKey() {
  const input = document.getElementById('widget-api-input');
  const key = input.value.trim();
  if (!key) return;
  setWidgetApiKey(key);
  document.getElementById('widget-api-modal').style.display = 'none';
  // Continue with last user message if any pending
}

function closeApiKeyModal() {
  document.getElementById('widget-api-modal').style.display = 'none';
}

function clearWidgetChat() {
  if (!confirm('Saari chat history clear karni hai?')) return;
  widgetConversation = [];
  localStorage.removeItem('talha_chat_history');
  renderWidgetMessages();
}

// Inject widget HTML and styles
function injectChatWidget() {
  // Don't inject on the dedicated chat page
  if (window.location.pathname.includes('ask-talha.html')) return;

  const widgetHTML = `
    <button id="chat-widget-btn" class="chat-widget-btn" onclick="toggleChatWidget()" aria-label="Chat with AI Talha">
      <span class="widget-icon-chat">💬</span>
      <span class="widget-icon-close">×</span>
      <span class="widget-pulse"></span>
    </button>

    <div id="chat-widget-panel" class="chat-widget-panel">
      <div class="widget-header">
        <div class="widget-header-info">
          <div class="widget-avatar">T</div>
          <div>
            <div class="widget-title">AI Talha</div>
            <div class="widget-status"><span class="status-dot"></span>Online · 24/7</div>
          </div>
        </div>
        <button onclick="clearWidgetChat()" class="widget-clear" aria-label="Clear chat">⟲</button>
      </div>

      <div id="widget-messages" class="widget-messages"></div>

      <div id="widget-quick-strip" class="widget-quick-strip"></div>

      <div class="widget-input-row">
        <input type="text" id="widget-input" class="widget-input" placeholder="Apna sawaal yahan likho..." autocomplete="off" />
        <button id="widget-send" onclick="handleWidgetSend()" class="widget-send" aria-label="Send">↑</button>
      </div>

      <div class="widget-footer">Powered by AI · Roman Urdu mein bolo</div>
    </div>

    <div id="widget-api-modal" class="widget-modal-overlay">
      <div class="widget-modal">
        <h3 style="margin: 0 0 8px 0;">API Key Chahiye</h3>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">
          AI chat use karne ke liye OpenRouter ka free API key chahiye.
        </p>
        <ol style="font-size: 13px; padding-left: 18px; margin-bottom: 12px;">
          <li><a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a> pe jao</li>
          <li>Sign up + create key (free)</li>
          <li>Yahan paste karo:</li>
        </ol>
        <input type="password" id="widget-api-input" class="widget-modal-input" placeholder="sk-or-v1-..." />
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="widget-btn-primary" onclick="saveWidgetApiKey()">Save</button>
          <button class="widget-btn-secondary" onclick="closeApiKeyModal()">Cancel</button>
        </div>
        <p style="font-size: 11px; color: var(--muted); margin: 12px 0 0; text-align: center;">
          Key sirf tumhare browser mein save hoti hai. 100% private.
        </p>
      </div>
    </div>
  `;

  const widgetStyles = `
    <style>
      /* Floating Chat Widget */
      .chat-widget-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--green);
        color: white;
        border: none;
        cursor: pointer;
        z-index: 999;
        box-shadow: 0 6px 20px rgba(0, 168, 107, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s;
        position: fixed;
      }
      .chat-widget-btn:hover { transform: scale(1.05); background: var(--green-dark); }
      .chat-widget-btn .widget-icon-chat { font-size: 24px; transition: opacity 0.2s, transform 0.3s; }
      .chat-widget-btn .widget-icon-close { font-size: 32px; position: absolute; opacity: 0; transition: opacity 0.2s, transform 0.3s; transform: rotate(-90deg); }
      .chat-widget-btn.open .widget-icon-chat { opacity: 0; transform: rotate(90deg); }
      .chat-widget-btn.open .widget-icon-close { opacity: 1; transform: rotate(0); }
      .widget-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--green);
        opacity: 0.3;
        animation: widgetPulse 2s ease-out infinite;
        pointer-events: none;
      }
      @keyframes widgetPulse {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      .chat-widget-btn.open .widget-pulse { display: none; }

      .chat-widget-panel {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 580px;
        max-height: calc(100vh - 140px);
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08);
        z-index: 998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.25s, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .chat-widget-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 18px;
        background: linear-gradient(135deg, var(--green), var(--green-dark));
        color: white;
      }
      .widget-header-info { display: flex; gap: 12px; align-items: center; }
      .widget-avatar {
        width: 42px;
        height: 42px;
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        border: 2px solid rgba(255,255,255,0.3);
      }
      .widget-title { font-weight: 700; font-size: 15px; line-height: 1.2; }
      .widget-status { font-size: 12px; opacity: 0.9; display: flex; align-items: center; gap: 6px; line-height: 1.2; margin-top: 2px; }
      .status-dot {
        width: 8px; height: 8px;
        background: #4ade80;
        border-radius: 50%;
        box-shadow: 0 0 6px #4ade80;
      }
      .widget-clear {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }
      .widget-clear:hover { background: rgba(255,255,255,0.3); }

      .widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #fafafa;
      }
      .widget-msg {
        max-width: 88%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.5;
      }
      .widget-msg p { margin: 0 0 4px; }
      .widget-msg p:last-child { margin-bottom: 0; }
      .widget-msg.user {
        align-self: flex-end;
        background: var(--green);
        color: white;
        border-bottom-right-radius: 4px;
      }
      .widget-msg.bot {
        align-self: flex-start;
        background: white;
        border: 1px solid var(--line);
        color: var(--text);
        border-bottom-left-radius: 4px;
      }
      .widget-msg.bot strong { color: var(--green-dark); }
      .widget-msg.bot ul, .widget-msg.bot ol { padding-left: 20px; margin: 6px 0; }
      .widget-msg.bot li { margin-bottom: 4px; font-size: 14px; }

      .widget-typing { padding: 14px 18px; display: flex; gap: 4px; }
      .typing-dot {
        width: 7px; height: 7px;
        background: var(--green);
        border-radius: 50%;
        animation: typingDot 1.2s infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingDot {
        0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-4px); }
      }

      .widget-suggestions {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 12px;
        padding: 0 4px;
      }
      .widget-suggestions-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--muted);
        padding: 0 4px 6px;
      }
      .widget-suggestions button {
        background: white;
        border: 1px solid var(--line);
        padding: 10px 14px;
        border-radius: 100px;
        font-family: inherit;
        font-size: 13px;
        color: var(--text-2);
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
        font-weight: 500;
      }
      .widget-suggestions button:hover {
        border-color: var(--green);
        color: var(--green);
        background: var(--green-light);
      }

      /* Quick suggestion strip (visible during conversation) */
      .widget-quick-strip {
        padding: 8px 12px 4px;
        background: white;
        border-top: 1px solid var(--line);
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }
      .widget-quick-strip:not(:empty) {
        max-height: 60px;
      }
      .widget-quick-row {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 6px;
        scrollbar-width: none;
      }
      .widget-quick-row::-webkit-scrollbar { display: none; }
      .widget-quick-chip {
        flex-shrink: 0;
        background: var(--green-light);
        border: 1px solid rgba(0,168,107,0.25);
        padding: 6px 12px;
        border-radius: 100px;
        font-family: inherit;
        font-size: 11px;
        color: var(--green-dark);
        cursor: pointer;
        white-space: nowrap;
        font-weight: 600;
        transition: all 0.15s;
      }
      .widget-quick-chip:hover {
        background: var(--green);
        color: white;
        border-color: var(--green);
      }

      .widget-input-row {
        padding: 12px;
        background: white;
        border-top: 1px solid var(--line);
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .widget-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid var(--line);
        border-radius: 100px;
        font-family: inherit;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .widget-input:focus { border-color: var(--green); }
      .widget-send {
        width: 40px; height: 40px;
        background: var(--green);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }
      .widget-send:hover { background: var(--green-dark); }
      .widget-send:disabled { opacity: 0.5; cursor: not-allowed; }

      .widget-footer {
        padding: 8px 16px;
        text-align: center;
        font-size: 11px;
        color: var(--muted);
        background: white;
        border-top: 1px solid var(--line);
      }

      .widget-modal-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        z-index: 9999;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .widget-modal {
        background: white;
        padding: 28px;
        border-radius: 16px;
        max-width: 420px;
        width: 100%;
      }
      .widget-modal-input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        outline: none;
      }
      .widget-modal-input:focus { border-color: var(--green); }
      .widget-btn-primary, .widget-btn-secondary {
        flex: 1;
        padding: 10px 16px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
      }
      .widget-btn-primary {
        background: var(--green);
        color: white;
      }
      .widget-btn-primary:hover { background: var(--green-dark); }
      .widget-btn-secondary {
        background: var(--surface-2);
        color: var(--text);
      }
      .widget-btn-secondary:hover { background: var(--line); }

      @media (max-width: 600px) {
        .chat-widget-btn { bottom: 16px; right: 16px; width: 54px; height: 54px; }
        .chat-widget-panel {
          right: 8px;
          left: 8px;
          width: auto;
          bottom: 80px;
          height: calc(100vh - 100px);
        }
      }
    </style>
  `;

  document.head.insertAdjacentHTML('beforeend', widgetStyles);
  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  // Bind input enter key
  setTimeout(() => {
    const input = document.getElementById('widget-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleWidgetSend();
        }
      });
    }
    loadWidgetConversation();
    renderWidgetMessages();
  }, 100);
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectChatWidget);
} else {
  injectChatWidget();
}
