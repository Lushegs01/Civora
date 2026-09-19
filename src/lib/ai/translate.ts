export async function translateCivicInfo(text: string, locale: string): Promise<string> {
  // Try OpenAI if configured
  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    try {
      const targetLang = locale === "ha" ? "Hausa" : locale === "fr" ? "French" : "English";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a professional civic translator. Translate the following text into ${targetLang}. Ensure the translation is clear and culturally appropriate. Do not add any extra commentary.`
            },
            { role: "user", content: text }
          ],
          temperature: 0.3
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
      }
    } catch (e) {
      console.error("OpenAI translate failed, falling back to mock", e);
    }
  }

  // Deterministic mock fallback for demo
  if (locale === "ha") {
    return `Wannan fassarar gwaji ce (Mock). Muna sanar da ku cewa wannan tsarin yana aiki.\n\n${text.replace(/[a-zA-Z]+/g, (match) => {
      // Very crude visual substitution just so it looks "translated" for offline demos
      if (match.length > 4) return match.split('').reverse().join('');
      return match;
    })}`;
  }
  if (locale === "fr") {
    return `Ceci est une traduction fictive (Mock). Nous vous informons que ce système fonctionne.\n\n${text.replace(/[a-zA-Z]+/g, (match) => {
      if (match.length > 5) return match + "e";
      return match;
    })}`;
  }
  
  return text;
}
