document.addEventListener("DOMContentLoaded", () => {
  // ---------- INTRO SCREEN ----------
  const introEl = document.getElementById("intro");
  const chatAppEl = document.getElementById("chatApp");
  const introImgEl = document.querySelector(".intro-img");

  function exitIntro() {
    if (!introEl || introEl.classList.contains("hidden")) return;
    introEl.classList.add("hidden");
    introEl.setAttribute("aria-hidden", "true");
    if (chatAppEl) chatAppEl.classList.remove("hidden");
  }

  if (introEl) {
    ["click", "touchend"].forEach((evt) => {
      introEl.addEventListener(
        evt,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          exitIntro();
        },
        { passive: false }
      );
    });
    if (introImgEl) {
      ["click", "touchend"].forEach((evt) => {
        introImgEl.addEventListener(
          evt,
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            exitIntro();
          },
          { passive: false }
        );
      });
    }
    introEl.tabIndex = 0;
    introEl.setAttribute("role", "button");
    introEl.setAttribute("aria-label", "Start");
    introEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        exitIntro();
      }
    });
  }

  // ---------- THEME SWITCHING ----------
  const rootStyle = document.documentElement.style;
  const THEMES = [
    // 0: Ballerina
    {
      aiBg: "var(--char1-yellow-dark)",
      aiText: "var(--visitor-gray-dark)",
      chatbox: "var(--char1-yellow-light)",
      nameColor: "var(--visitor-gray-dark)",
    },
    // 1: Acrobat
    {
      aiBg: "var(--char2-purple-dark)",
      aiText: "var(--char2-purple-light)",
      chatbox: "var(--char2-purple-light)",
      nameColor: "var(--char2-purple-dark)",
    },
    // 2: Pirates
    {
      aiBg: "var(--char3-blue-dark)",
      aiText: "var(--char3-blue-light)",
      chatbox: "var(--char3-blue-light)",
      nameColor: "var(--char3-blue-dark)",
    },
    // 3: Traveler
    {
      aiBg: "var(--char4-green-dark)",
      aiText: "var(--char4-green-light)",
      chatbox: "var(--char4-green-light)",
      nameColor: "var(--char4-green-dark)",
    },
    // 4: Apprentice
    {
      aiBg: "var(--char5-red-dark)",
      aiText: "var(--char5-red-light)",
      chatbox: "var(--char5-red-light)",
      nameColor: "var(--char5-red-dark)",
    },
  ];

  function applyTheme(idx) {
    const t = THEMES[idx];
    if (!t) return;
    rootStyle.setProperty("--ai-bubble-bg", t.aiBg);
    rootStyle.setProperty("--ai-bubble-text", t.aiText);
    rootStyle.setProperty("--chatbox-color", t.chatbox);
    rootStyle.setProperty("--char-name-color", t.nameColor);
  }

  // ---------- AVATAR LABELS & PERSONAS ----------
  const NAME_BY_INDEX = [
    "---------- Ballerina ----------",
    "---------- Acrobat ----------",
    "---------- Pirates ----------",
    "---------- Traveler ----------",
    "---------- Apprentice ----------",
  ];

  // Your updated persona instructions (include the “you already ask the question of: …” part)
  const PERSONA_BY_INDEX = [
    "Within a sentence, please respond as a timidity ballerina to the user's response positively. you already ask the question of: I’ve always wondered, is there more beyond the curtains—can I peek just a little?. please make sure you stay on topic",
    "Within a sentence, please respond as an careful acrobat to the user's response positively. you already ask the question of: I’ve always chosen my masks based on what makes others happy—what if I pick a mask just because it makes me smile?. please make sure you stay on topic",
    "Within a sentence, please respond as an brave pirate to the user's response positively. you already ask the question of: I have so many dreams and ideas—how do I know which one to follow first?. please make sure you stay on topic",
    "WITHIN A SENTENCE, please respond as an exciting traveler to the user's response positively. you already ask the question of: What’s the best thing to do if the road ahead looks exciting, but I’m not sure where it leads?. please make sure you stay on topic",
    "Within a sentence, please respond as an uncertain Apprentice to the user's response positively. you already ask the question of: If my outfit still has a few loose stitches, is it alright to step onto the stage confidently anyway?. please make sure you stay on topic",
  ];

  // Extract just the question text for the first AI bubble per avatar
  const INITIAL_QUESTION_BY_INDEX = [
    "I’ve always wondered, is there more beyond the curtains—can I peek just a little?",
    "I’ve always chosen my masks based on what makes others happy—what if I pick a mask just because it makes me smile?",
    "I have so many dreams and ideas—how do I know which one to follow first?",
    "What’s the best thing to do if the road ahead looks exciting, but I’m not sure where it leads?",
    "If my outfit still has a few loose stitches, is it alright to step onto the stage confidently anyway?",
  ];

  // ---------- PER-AVATAR CHAT STATE ----------
  // Each entry: [{ role: 'user'|'ai'|'system', text: '...' }, ...]
  const chats = Array.from({ length: 5 }, () => []);
  let currentAvatar = 0; // default to first avatar on load

  // ---------- DOM HOOKS ----------
  const charNameEl = document.getElementById("char_name");
  const messagesEl = document.getElementById("messages");
  const formEl = document.getElementById("chatForm");
  const inputEl = document.getElementById("chatInput");

  function setCharName(name) {
    if (charNameEl) charNameEl.textContent = name;
  }

  // ---------- RENDERING ----------
  function clearMessages() {
    messagesEl.innerHTML = "";
  }

  function renderHistory(idx) {
    clearMessages();
    const history = chats[idx] || [];
    history.forEach(({ role, text }) => {
      const div = document.createElement("div");
      const bubbleRole = role === "assistant" ? "ai" : role;
      div.className = `msg ${bubbleRole}`;
      div.textContent = text;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function pushAndRender(role, text) {
    chats[currentAvatar].push({ role, text });
    const div = document.createElement("div");
    const bubbleRole = role === "assistant" ? "ai" : role;
    div.className = `msg ${bubbleRole}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Ensure the first AI bubble exists for avatar idx
  function ensureInitialMessage(idx) {
    const history = chats[idx];
    if (!history || history.length === 0) {
      const q = INITIAL_QUESTION_BY_INDEX[idx] || "";
      // Seed the history with the AI question
      history.push({ role: "ai", text: q });
    }
  }

  // ---------- BUILD PROMPT WITH CONTEXT ----------
  function buildPromptForModel(idx, userInput) {
    const persona = PERSONA_BY_INDEX[idx] || "";
    const history = chats[idx] || [];
    const MAX_LINES = 10; // last 5 exchanges
    const recent = history.slice(-MAX_LINES);

    const transcript = recent
      .map((m) => (m.role === "user" ? `User: ${m.text}` : `AI: ${m.text}`))
      .join("\n");

    return [
      persona,
      "",
      "Here is the recent conversation context:",
      transcript || "(no previous messages)",
      "",
      `Now continue. The user says: "${userInput}"`,
    ].join("\n");
  }

  // ---------- AVATAR CLICK: switch name, theme, and history ----------
  const avatarEls = document.querySelectorAll(".app-header.avatars .avatar");
  avatarEls.forEach((img, idx) => {
    img.classList.add("is-clickable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      NAME_BY_INDEX[idx] || `Character ${idx + 1}`
    );

    const apply = () => {
      currentAvatar = idx;
      setCharName(NAME_BY_INDEX[idx] || "Character");
      applyTheme(idx);
      ensureInitialMessage(idx); // seed first AI bubble if needed
      renderHistory(idx);
    };

    img.addEventListener("click", apply);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        apply();
      }
    });
  });

  // ---------- INITIALIZE DEFAULT AVATAR ----------
  setCharName(NAME_BY_INDEX[currentAvatar]);
  applyTheme(currentAvatar);
  ensureInitialMessage(currentAvatar); // seed default
  renderHistory(currentAvatar);

  // ---------- SUBMIT HANDLER ----------
  function addSystemNote(text) {
    const div = document.createElement("div");
    div.className = "msg system";
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  if (formEl && inputEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userText = inputEl.value.trim();
      if (!userText) return;

      pushAndRender("user", userText);
      inputEl.value = "";
      inputEl.focus();

      const typingNote = document.createElement("div");
      typingNote.className = "msg system";
      typingNote.textContent = "Thinking…";
      const theme = THEMES[currentAvatar];
      if (theme) {
        typingNote.style.backgroundColor = theme.chatbox
          .replace(")", ", 0.7)")
          .replace("rgb", "rgba");
        typingNote.style.color = "#000"; // optional: readable text
      }

      messagesEl.appendChild(typingNote);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      const packedPrompt = buildPromptForModel(currentAvatar, userText);
      const aiText = await fetchAIResponse(packedPrompt);

      typingNote.remove();
      pushAndRender("ai", aiText);
    });
  }

  // ---------- FETCH AI ----------
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
});
