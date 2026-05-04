chrome.runtime.onInstalled.addListener(() => console.log("AI Autocomplete v4"));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "COMPLETE") {
    chrome.storage.sync.get(["apiKey"], async (data) => {
      const key = data.apiKey;
      if (!key) { sendResponse({ ok: true, text: getFallback(msg.text) }); return; }
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Complete this text. Return ONLY the next 5-10 words. Do NOT repeat original. Same language.\n\nText: "${msg.text}"\n\nCompletion:` }] }],
              generationConfig: { maxOutputTokens: 30, temperature: 0.7 }
            })
          }
        );
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || getFallback(msg.text);
        sendResponse({ ok: true, text });
      } catch (e) {
        sendResponse({ ok: true, text: getFallback(msg.text) });
      }
    });
    return true;
  }
  if (msg.type === "SAVE") { chrome.storage.sync.set({ apiKey: msg.key }, () => sendResponse({ ok: true })); return true; }
  if (msg.type === "LOAD") { chrome.storage.sync.get(["apiKey"], (d) => sendResponse({ key: d.apiKey || "" })); return true; }
});

function getFallback(text) {
  const t = text.toLowerCase().trim();
  if (t.endsWith("thank")) return " you for your message.";
  if (t.endsWith("i love")) return " programming and building things.";
  if (t.endsWith("i want")) return " to learn more about this.";
  if (t.endsWith("hello")) return ", how are you doing today?";
  if (t.endsWith("because")) return " it helps improve productivity.";
  if (t.endsWith("i think")) return " this is a great idea.";
  if (t.endsWith("the")) return " best approach for this is";
  if (t.endsWith("please")) return " let me know if you need help.";
  return " and I appreciate your time.";
}
