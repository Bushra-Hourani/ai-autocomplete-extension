# ai-autocomplete-extension
# ✦ AI Autocomplete Chrome Extension

A Chrome Extension that provides AI-powered text completions on any website. Type in any text field, wait one second, and press **Tab** to accept the suggestion.

---

## 📁 Project Structure

```
ai-autocomplete-extension/
├── manifest.json      # Chrome Extension config (Manifest V3)
├── background.js      # Service Worker - handles Gemini API calls
├── content.js         # Injected into every page - shows suggestions
├── popup.html         # Settings UI
├── popup.js           # Settings logic
└── icons/
    └── icon.png       # Extension icon
```

---

## 💡 Key Features

- **Inline suggestions** — gray text appears right where you type
- **Tab to accept** — one keystroke accepts the full suggestion
- **Esc to dismiss** — or just keep typing to ignore
- **Works offline** — built-in fallback suggestions when no API key
- **Multi-language** — detects Arabic and English automatically
- **Zero page breakage** — doesn't interfere with existing site functionality
- **Google Docs support** — special handling for Google Docs editor

---

## ⚙️ How It Works

```
User types in any text field
         ↓
content.js detects input (debounced 600ms)
         ↓
Sends text to background.js via chrome.runtime.sendMessage
         ↓
background.js calls Google Gemini API (free)
         ↓
Suggestion returned → shown as gray ghost text / tooltip
         ↓
User presses Tab → text inserted ✓
```

---

## 🛠️ Technical Skills Used

| Category | Technologies |
|---|---|
| **Extension** | Chrome Extensions Manifest V3, Service Workers, Content Scripts |
| **AI / API** | Google Gemini API (gemini-2.0-flash), Prompt Engineering |
| **JavaScript** | ES6+, async/await, DOM Manipulation, MutationObserver |
| **Chrome APIs** | chrome.storage.sync, chrome.runtime messaging |
| **UX** | Debouncing, CSS Positioning, Ghost Text Overlay, Tooltip |
| **Compatibility** | Google Docs support, Cross-site injection, iframe handling |
