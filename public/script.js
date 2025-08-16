// ---------- SIMPLE WEB CHAT (no terminal) ----------

// ---------- INTRO SCREEN ----------
const introEl = document.getElementById("intro");
const chatAppEl = document.getElementById("chatApp");

introEl.addEventListener("click", () => {
  introEl.classList.add("hidden");
  chatAppEl.classList.remove("hidden");
});

// --- AI fetcher (kept your endpoint contract)
async function fetchAIResponse(input) {
  try {
    const response = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      console.error(
        "Error in API request:",
        response.status,
        response.statusText
      );
      return `Error: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    const text = (data?.ai ?? "").trim();
    return text.length ? text : "(Empty AI response)";
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Oops, something went wrong. Let's try again!";
  }
}

// --- Minimal UI helpers
const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");

function addMessage(text, role = "ai") {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystemNote(text) {
  const div = document.createElement("div");
  div.className = "msg system";
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// --- Submit handler
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = inputEl.value.trim();
  if (!userText) return;

  // show user bubble
  addMessage(userText, "user");
  inputEl.value = "";
  inputEl.focus();

  // build your prompt: you can change evaluationPrompt() as you like
  const prompt = evaluationPrompt(otherInput, userText);

  // show typing…
  const typingNote = document.createElement("div");
  typingNote.className = "msg system";
  typingNote.textContent = "Thinking…";
  messagesEl.appendChild(typingNote);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // get AI
  const aiText = await fetchAIResponse(prompt);

  // remove typing note & show AI bubble
  typingNote.remove();
  addMessage(aiText, "ai");
});

// Optional: initial hint
addSystemNote("The visitor has enter the chat!");
