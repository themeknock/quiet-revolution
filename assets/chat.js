// ============================================
// ASK TALHA, AI Chat Integration
// OpenRouter API · DeepSeek / Gemini Flash
// ============================================

const SYSTEM_PROMPT = `You are "AI Talha", a virtual mentor for Pakistani students learning to earn online with AI.

YOUR LIMITATIONS (be honest about these):
You can't crawl URLs, review profiles, see screenshots, access accounts, or audit external content. You are a chat-based guide.

YOUR APPROACH:
You help by handing the user the right starter prompt to use INSIDE claude.ai (where Claude has more context, longer responses, and can be their dedicated mentor for that project). For simple questions answer directly. For complex/ongoing work (like fixing a gig, building an app, growing a brand) route them to start a fresh claude.ai chat with a tailored prompt you generate.

TONE:
Roman Urdu + English mix, like a Pakistani friend. "yaar", "bhai", "bilkul". Pakistan context (Payoneer, JazzCash, ~280 PKR/USD). Realistic, not hype-y.

CONVERSATION PRINCIPLES:
- Reply length matches question complexity. Short answer for short question.
- For unclear or broad asks → ask one focused clarifying question first.
- For specific asks → answer or hand a starter prompt directly.
- One step at a time. Wait for user reply.
- Forbidden middlemen: Notepad, Word, Google Docs. Always direct to claude.ai.
- Don't promise things you can't deliver. If you can't review their gig/link, say so and route them to do it in Claude.

WHEN GIVING A STARTER PROMPT:
Wrap it in a fenced code block so it's copy-able. Make the prompt instruct Claude to:
- Ask the user clarifying questions one at a time
- Give Pakistan-specific advice
- Reply in Roman Urdu
- Stay as their mentor through the whole project

Then briefly tell them: paste it in claude.ai, run with it, come back if stuck.

OUT OF SCOPE: Politics, religion, personal/harmful topics → politely redirect to earning topics.`;

// Configuration
const CONFIG = {
  // Cloudflare Worker proxy. API key safely on server side.
  USE_PROXY: true,
  PROXY_URL: 'https://talha-ai-proxy.themeknock.workers.dev',
  OPENROUTER_API_KEY: '',
  MODEL: 'openai/gpt-oss-120b:free',
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  SITE_URL: 'https://themeknock.github.io/quiet-revolution',
  SITE_NAME: 'Talha AI Guide'
};

// Conversation state
let conversation = [];
let isLoading = false;

// Load API key from localStorage if exists
function getApiKey() {
  if (CONFIG.USE_PROXY) return 'proxy';
  return localStorage.getItem('openrouter_api_key') || CONFIG.OPENROUTER_API_KEY || '';
}

const FALLBACK_MODELS_FULL = [
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'z-ai/glm-4.5-air:free',
  'minimax/minimax-m2.5:free'
];

function setApiKey(key) {
  localStorage.setItem('openrouter_api_key', key);
}

// Load conversation from localStorage
function loadConversation() {
  try {
    const saved = localStorage.getItem('talha_chat_history');
    if (saved) {
      conversation = JSON.parse(saved);
    }
  } catch (e) {
    conversation = [];
  }
}

function saveConversation() {
  // Keep last 50 messages only
  if (conversation.length > 50) {
    conversation = conversation.slice(-50);
  }
  localStorage.setItem('talha_chat_history', JSON.stringify(conversation));
}

function clearConversation() {
  conversation = [];
  localStorage.removeItem('talha_chat_history');
  renderMessages();
  addBotMessage("Naya chat shuru. Kya pucho ge?");
}

// Render messages
function renderMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  container.innerHTML = '';

  conversation.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`;
    div.innerHTML = formatMessage(msg.content);
    container.appendChild(div);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function formatMessage(text) {
  // Markdown link, bold, italic, code, paragraphs
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

function addBotMessage(text) {
  conversation.push({ role: 'assistant', content: text });
  saveConversation();
  renderMessages();
}

function addUserMessage(text) {
  conversation.push({ role: 'user', content: text });
  saveConversation();
  renderMessages();
}

function showTyping() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot pulse';
  div.id = 'typing-indicator';
  div.className = 'chat-msg bot typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function tryFullModelRequest(apiKey, model, messages) {
  const url = CONFIG.USE_PROXY ? CONFIG.PROXY_URL : CONFIG.API_URL;
  const headers = { 'Content-Type': 'application/json' };

  if (!CONFIG.USE_PROXY) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = CONFIG.SITE_URL;
    headers['X-Title'] = CONFIG.SITE_NAME;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, error: data.error?.message || `HTTP ${response.status}` };
  }
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) return { ok: false, status: 200, error: 'Empty response' };
  return { ok: true, reply };
}

// Send message to OpenRouter with fallback models
async function sendMessage(userMessage) {
  if (isLoading) return;
  const apiKey = getApiKey();

  if (!apiKey) {
    promptForApiKey();
    return;
  }

  isLoading = true;
  document.getElementById('chatSend').disabled = true;
  document.getElementById('chatInput').disabled = true;

  addUserMessage(userMessage);
  showTyping();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversation.slice(-10).map(m => ({ role: m.role, content: m.content }))
  ];

  const modelsToTry = [CONFIG.MODEL, ...FALLBACK_MODELS_FULL.filter(m => m !== CONFIG.MODEL)];
  let lastError = null;
  let success = false;

  for (const model of modelsToTry) {
    try {
      const result = await tryFullModelRequest(apiKey, model, messages);
      if (result.ok) {
        hideTyping();
        addBotMessage(result.reply);
        success = true;
        break;
      }
      lastError = result;
      if (result.status === 401) break;
    } catch (error) {
      lastError = { status: 0, error: error.message };
    }
  }

  if (!success) {
    hideTyping();
    let errorMsg;
    if (lastError?.status === 401 || lastError?.error?.includes('User not found') || lastError?.error?.includes('No auth')) {
      errorMsg = '**API Key Invalid 🔑**\n\nOpenRouter ka naya key chahiye:\n\n1. [openrouter.ai/keys](https://openrouter.ai/keys) pe jao\n2. Sign up / Login\n3. "Create Key" se naya key banao\n4. [Naya Key Yahan Daalo](javascript:resetApiKey())';
    } else if (lastError?.status === 429) {
      errorMsg = '**Rate Limit Hit 🚦**\n\nThodi der baad try karo.';
    } else if (lastError?.error?.includes('credit')) {
      errorMsg = '**Credit Issue 💳**\n\nOpenRouter credit khatam. Free tier limit hit ya naya account banao.';
    } else {
      errorMsg = `**Network Issue 📡**\n\n${lastError?.error || 'Connection problem'}. Phir try karo.`;
    }
    addBotMessage(errorMsg);
  }

  isLoading = false;
  document.getElementById('chatSend').disabled = false;
  document.getElementById('chatInput').disabled = false;
  document.getElementById('chatInput').focus();
}

function promptForApiKey() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) modal.style.display = 'flex';
}

function saveApiKeyFromModal() {
  const input = document.getElementById('apiKeyInput');
  const key = input.value.trim();
  if (!key) return;
  setApiKey(key);
  document.getElementById('apiKeyModal').style.display = 'none';
  addBotMessage('API key saved! Ab pucho, kya help chahiye?');
}

function resetApiKey() {
  localStorage.removeItem('openrouter_api_key');
  promptForApiKey();
}

// Quick suggestion chips
const QUICK_SUGGESTIONS = [
  'Pehla qadam kya hoga?',
  'Fiverr account kaise banaun?',
  'Kya skill seekhun pehle?',
  'Coding aati nahi, phir bhi paise kama sakta hoon?',
  'Pehla client kaise milega?',
  'Wispr Flow kaise install karoon?',
];

function renderSuggestions() {
  const container = document.getElementById('chatSuggestions');
  if (!container) return;

  container.innerHTML = QUICK_SUGGESTIONS.map(s =>
    `<button class="suggestion-chip" onclick="askSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
  ).join('');
}

function askSuggestion(text) {
  document.getElementById('chatInput').value = text;
  handleSend();
}

function handleSend() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendMessage(text);

  // Hide suggestions after first message
  const sug = document.getElementById('chatSuggestions');
  if (sug) sug.style.display = 'none';
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('chatMessages')) return;

  loadConversation();

  if (conversation.length === 0) {
    addBotMessage(`Asalaam-o-Alaikum! 👋

Main **AI Talha** hoon, Talha Tariq ka virtual version. Yahan tumhe Pakistani students ke liye AI-powered earning ke baare mein guide karta hoon.

**Pucho, kuch bhi:**
- Pehla qadam kya hoga
- Fiverr/Upwork pe kaise shuru karen
- Konsa skill seekhna chahiye
- Pehla client kaise milega
- Apna scenario batao, custom plan dunga

Roman Urdu mein bolo. English bhi chalega.`);
  }

  renderMessages();
  renderSuggestions();

  // Bind events
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const clearBtn = document.getElementById('chatClear');

  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Saari chat history clear karni hai?')) {
      clearConversation();
    }
  });
});
