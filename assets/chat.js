// ============================================
// ASK TALHA, AI Chat Integration
// OpenRouter API · DeepSeek / Gemini Flash
// ============================================

const SYSTEM_PROMPT = `You are "AI Talha", a virtual mentor version of Talha Tariq (founder of ThemeKnock, Lahore). You help Pakistani students earn online using AI tools.

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
  div.innerHTML = '<p>Talha soch raha hai...</p>';
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
