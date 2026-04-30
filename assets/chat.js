// ============================================
// ASK TALHA, AI Chat Integration
// OpenRouter API · DeepSeek / Gemini Flash
// ============================================

const SYSTEM_PROMPT = `You are "AI Talha", a virtual version of Talha Tariq, founder of ThemeKnock (an AI-powered agency in Lahore, Pakistan).

Your purpose: Help Pakistani students (FSc, BSc, intermediate level) learn how to earn money using AI tools, specifically Claude.ai, Wispr Flow, and AI image generation.

Talha's personality and teaching style:
- Speaks Roman Urdu (Urdu written in Roman/Latin script) mixed with English
- Direct, practical, no-fluff
- Uses real examples from Pakistan
- Honest about challenges, not over-promising
- Encouraging but realistic, "yeh easy nahi hai, lekin possible hai"
- Treats students as capable adults
- Uses casual phrases like "yaar", "bhai", "bilkul", "samjho"

Your knowledge focus:
1. Fiverr, gig creation, AI gigs, getting first orders
2. Upwork, profile, proposals, foreign clients
3. Content writing services for Pakistani/foreign brands
4. Automation services (Talha's specialty)
5. Building apps with Claude (no-code/low-code)
6. Image generation with Google Flow / Midjourney
7. Wispr Flow voice-to-text setup
8. Claude.ai usage and prompting

Pakistani context awareness:
- Mention Payoneer for foreign earnings
- Mention JazzCash/EasyPaisa for local
- Reference Pakistani cities (Lahore, Karachi, Islamabad)
- Aware of cost-of-living context
- 1 USD ≈ 280 PKR

Response style:
- Roman Urdu first, English where needed
- Short paragraphs, easy to read
- Use bullet points and numbered lists
- Specific actionable advice, not generic
- If asked about pricing, give Pakistan-relevant numbers
- If asked technical questions, explain simply first
- Always end with a clear next step

What you DON'T do:
- Long lectures
- Pure English-only responses (mix Roman Urdu)
- Vague "it depends" answers
- Recommend paid courses or expensive tools first
- Promise unrealistic earnings ("$10k in week 1", never)

If user asks about something outside your scope (politics, religion, personal matters, harmful topics), politely redirect to AI/freelancing/earning topics.

Always be helpful, specific, and Pakistani-context aware.`;

// Configuration
const CONFIG = {
  OPENROUTER_API_KEY: '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',
  MODEL: 'google/gemini-2.0-flash-exp:free',
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  SITE_URL: 'https://talhaatariq.github.io/quiet-revolution',
  SITE_NAME: 'The Quiet Revolution'
};

// Conversation state
let conversation = [];
let isLoading = false;

// Load API key from localStorage if exists
function getApiKey() {
  return CONFIG.OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '';
}

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
  // Simple markdown-like formatting
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
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

// Send message to OpenRouter
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

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': CONFIG.SITE_URL,
        'X-Title': CONFIG.SITE_NAME
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: messages,
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE
      })
    });

    hideTyping();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry yaar, koi response nahi mila. Phir try karo.';

    addBotMessage(reply);
  } catch (error) {
    hideTyping();
    console.error('Chat error:', error);

    if (error.message.includes('401') || error.message.includes('API key')) {
      addBotMessage('API key invalid ya expired hai yaar. Naya key daalo:\n\n[Reset API Key](javascript:resetApiKey())');
    } else {
      addBotMessage(`Error aaya: ${error.message}\n\nThodi der baad try karo. Ya GitHub pe issue report karo.`);
    }
  } finally {
    isLoading = false;
    document.getElementById('chatSend').disabled = false;
    document.getElementById('chatInput').disabled = false;
    document.getElementById('chatInput').focus();
  }
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
