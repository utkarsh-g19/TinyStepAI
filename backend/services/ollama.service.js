const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";

async function chatWithOllama(payload) {
  const response = await fetch(OLLAMA_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(`Ollama returned HTTP ${response.status}: ${details}`);
  }

  return response.json();
}

module.exports = { chatWithOllama };
