# 🌱 The Quiet Revolution

> **Pakistani students ke liye AI-powered earning ka complete practical guide.**
> By [Talha Tariq](https://github.com/talhaatariq) · [ThemeKnock](https://themeknock.com)

A free, comprehensive resource for Pakistani students who want to start earning online using AI tools, without coding, without paid courses, without prior experience.

🌐 **Live site:** https://talhaatariq.github.io/quiet-revolution

---

## 📚 What's Inside

### Setup Guides
- **Claude.ai Setup**, sign up walkthrough, prompt engineering basics
- **Wispr Flow**, voice-to-text setup, replace typing forever
- **Daily Workflow**, exactly how Talha works at ThemeKnock

### Earning Paths
- **Fiverr Guide**, gig creation, AI gigs, getting first orders
- **Upwork Guide**, profile, proposals, foreign clients
- **Content Writing**, first $1,000/month with Pakistani brands
- **Automation Services**, recurring monthly income (Talha's specialty)
- **SaaS Building**, building your own product

### Building With AI
- **Apps Banao**, non-technical guide to building real web apps
- **Image Generation**, Google Flow, prompt engineering
- **Prompts Library**, 50+ ready-to-use prompts

### AI Assistant
- **Ask Talha (AI)**, 24/7 chat, Talha's voice and teaching style, powered by OpenRouter

---

## 🛠 Tech Stack

- **Pure HTML/CSS/JS**, no frameworks, no build step
- **GitHub Pages**, free hosting
- **OpenRouter API**, for AI chat (DeepSeek/Gemini Flash)
- **Vanilla JavaScript**, no dependencies

Lightweight, fast, accessible from any device.

---

## 🚀 Setup (For Future Events / Forks)

### 1. Clone the repo
```bash
git clone https://github.com/talhaatariq/quiet-revolution.git
cd quiet-revolution
```

### 2. (Optional) Configure AI Chat
Edit `assets/chat.js`:
```javascript
const CONFIG = {
  OPENROUTER_API_KEY: 'your-key-here', // Or leave blank to ask user
  MODEL: 'deepseek/deepseek-chat',     // or 'google/gemini-flash-1.5'
  // ...
};
```

⚠️ **Warning:** Hardcoding API key makes it public. Better options:
- Leave blank, users provide their own key (saved in their localStorage)
- Use a Cloudflare Worker proxy to hide the key
- Use environment variables in a backend deployment

Get a free OpenRouter key at: https://openrouter.ai/keys

### 3. Deploy to GitHub Pages
1. Push to GitHub
2. Settings → Pages → Source: `main` branch / root
3. Wait 1-2 minutes
4. Live at `https://YOUR_USERNAME.github.io/quiet-revolution/`

---

## 🎤 For Speakers / Teachers

This resource is **freely reusable** for any AI/freelancing event in Pakistan or globally. Feel free to:

- ✅ Fork and rebrand for your own event
- ✅ Translate content
- ✅ Add your own niche guides
- ✅ Use as reference material in talks

If you find it useful, a star ⭐ and link back is appreciated.

---

## 📁 Structure

```
quiet-revolution/
├── index.html                    # Home page
├── README.md
├── PLAN.md                       # Project planning doc
├── pages/
│   ├── start-here.html
│   ├── claude-setup.html
│   ├── wispr-setup.html
│   ├── workflow.html
│   ├── fiverr-guide.html
│   ├── upwork-guide.html
│   ├── content-writing.html
│   ├── automation.html
│   ├── saas-guide.html
│   ├── build-apps.html
│   ├── image-generation.html
│   ├── prompts-library.html
│   └── ask-talha.html           # AI assistant
└── assets/
    ├── styles.css                # Shared design system
    ├── components.js             # Sidebar, mobile nav
    └── chat.js                   # OpenRouter integration
```

---

## 🎨 Design Philosophy

- **Mobile-first**, most students access on phones
- **Roman Urdu first**, students think in Roman Urdu
- **No fluff**, every line is actionable
- **Premium feel**, looks like a paid course
- **Honest**, realistic timelines, no hype
- **Pakistan-specific**, local pricing, banks, examples

---

## 📞 Contact

- **Talha Tariq**
- Founder, ThemeKnock
- Lahore, Pakistan
- Email: talhaatariq4@gmail.com

---

## 📜 License

MIT, Use freely, attribute if you can.

---

*Built with AI. About AI. For students who want to use AI to change their lives.*

**The Quiet Revolution. Already happening. Are you in it?**
