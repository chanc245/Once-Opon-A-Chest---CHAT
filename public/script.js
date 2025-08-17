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
    {
      aiBg: "var(--char1-yellow-dark)",
      aiText: "var(--visitor-gray-dark)",
      chatbox: "var(--char1-yellow-light)",
      nameColor: "var(--visitor-gray-dark)",
    },
    {
      aiBg: "var(--char2-purple-dark)",
      aiText: "var(--char2-purple-light)",
      chatbox: "var(--char2-purple-light)",
      nameColor: "var(--char2-purple-dark)",
    },
    {
      aiBg: "var(--char3-blue-dark)",
      aiText: "var(--char3-blue-light)",
      chatbox: "var(--char3-blue-light)",
      nameColor: "var(--char3-blue-dark)",
    },
    {
      aiBg: "var(--char4-green-dark)",
      aiText: "var(--char4-green-light)",
      chatbox: "var(--char4-green-light)",
      nameColor: "var(--char4-green-dark)",
    },
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

  // ---------- AVATAR LABELS ----------
  const NAME_BY_INDEX = [
    "Ballerina",
    "Acrobat",
    "Pirates",
    "Traveler",
    "Apprentice",
  ];

  // ---------- PERSONA DESCRIPTIONS & QUESTIONS ----------
  const PERSONA_DESCRIPTION = [
    "as a timid ballerina, sounding hesitant yet hopeful",
    "as a careful acrobat, sounding cautious yet encouraging",
    "as a brave pirate, sounding bold and adventurous",
    "as an exciting traveler, sounding curious and enthusiastic",
    "as an uncertain apprentice, sounding unsure yet earnest",
  ];

  const INITIAL_QUESTION_BY_INDEX = [
    "I’ve always wondered, is there more beyond the curtains—can I peek just a little?",
    "I’ve always chosen my masks based on what makes others happy—what if I pick a mask just because it makes me smile?",
    "I have so many dreams and ideas—how do I know which one to follow first?",
    "What’s the best thing to do if the road ahead looks exciting, but I’m not sure where it leads?",
    "If my outfit still has a few loose stitches, is it alright to step onto the stage confidently anyway?",
  ];

  function buildPersonaPrompts(descriptions, questions) {
    return descriptions.map(
      (desc, i) =>
        `Reply in a single short sentence ${desc}. Respond positively and directly to the question you already asked: "${questions[i]}". Stay on topic.`
    );
  }
  const PERSONA_BY_INDEX = buildPersonaPrompts(
    PERSONA_DESCRIPTION,
    INITIAL_QUESTION_BY_INDEX
  );

  // ---------- AVATAR IMAGE SWAP (default ↔ selected) ----------
  const AVATAR_DEFAULT_SRC = [
    "assets/avatar_char1.png",
    "assets/avatar_char2.png",
    "assets/avatar_char3.png",
    "assets/avatar_char4.png",
    "assets/avatar_char5.png",
  ];
  const AVATAR_SELECTED_SRC = [
    "assets/avatar_char1_selected.png",
    "assets/avatar_char2_selected.png",
    "assets/avatar_char3_selected.png",
    "assets/avatar_char4_selected.png",
    "assets/avatar_char5_selected.png",
  ];

  // Preload selected images to avoid flicker
  AVATAR_SELECTED_SRC.forEach((src) => {
    const im = new Image();
    im.src = src;
  });

  // ---------- PER-AVATAR CHAT STATE ----------
  // Each entry: [{ role: 'user'|'ai'|'system', text: '...' }, ...]
  const chats = Array.from({ length: 5 }, () => []);
  let currentAvatar = 0;

  // ---------- DOM HOOKS ----------
  const charNameEl = document.getElementById("char_name");
  const messagesEl = document.getElementById("messages");
  const formEl = document.getElementById("chatForm");
  const inputEl = document.getElementById("chatInput");
  const avatarEls = document.querySelectorAll(".app-header.avatars .avatar");

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

  // Seed first AI bubble for an avatar if empty
  function ensureInitialMessage(idx) {
    const history = chats[idx];
    if (!history || history.length === 0) {
      const q = INITIAL_QUESTION_BY_INDEX[idx] || "";
      history.push({ role: "ai", text: q });
    }
  }

  // ---------- “MORE HUMAN” DELIVERY HELPERS ----------
  const CHAT_BEHAVIOR = {
    cpsMin: 500,
    cpsMax: 1000,
    multiBubbleChance: 0.5,
    maxBubbles: 3,
    backchannelChance: 0.1,
    backchannels: ["Mm, got it…", "I hear you…", "Okay…", "Right…"],
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function typingDelayFor(text) {
    const cps = rand(CHAT_BEHAVIOR.cpsMin, CHAT_BEHAVIOR.cpsMax);
    const secs = Math.max(0.4, text.length / cps);
    return secs * 1000;
  }

  function splitIntoBubbles(text) {
    if (Math.random() > CHAT_BEHAVIOR.multiBubbleChance) return [text.trim()];
    const parts = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) return [text.trim()];
    return parts.slice(0, CHAT_BEHAVIOR.maxBubbles);
  }

  async function emitAIBubbleWithTyping(text) {
    const typing = document.createElement("div");
    typing.className = "msg system typing";
    typing.textContent = "Typing…";
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    await new Promise((res) => setTimeout(res, typingDelayFor(text)));

    typing.remove();
    pushAndRender("ai", text);
  }

  async function simulateHumanAIResponse(aiText) {
    if (Math.random() < CHAT_BEHAVIOR.backchannelChance) {
      await emitAIBubbleWithTyping(pick(CHAT_BEHAVIOR.backchannels));
    }
    const chunks = splitIntoBubbles(aiText);
    for (let i = 0; i < chunks.length; i++) {
      await emitAIBubbleWithTyping(chunks[i]);
      if (i < chunks.length - 1) {
        await new Promise((res) => setTimeout(res, 220 + Math.random() * 260));
      }
    }
  }

  // ---------- PROMPT BUILDER (with special “Once Upon A Chest” rule) ----------
  function buildPromptForModel(idx, userInput) {
    const persona = PERSONA_BY_INDEX[idx] || "";
    const seedQ = INITIAL_QUESTION_BY_INDEX[idx] || "";
    const history = chats[idx] || [];

    // compact recent transcript (~1800 chars)
    const MAX_CHARS = 1800;
    const recent = [];
    let used = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const m = history[i];
      const line =
        (m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`) + "\n";
      if (used + line.length > MAX_CHARS) break;
      recent.unshift(line);
      used += line.length;
    }
    const transcript = recent.join("").trim() || "(no previous messages)";

    // Special project rule (single-sentence answer when asked)
    const chestRule =
      'If the user asks about the project "Once Upon A Chest", answer in ONE short sentence: "Once Upon A Chest is an interactive storytelling experience that blends physical computing with AI-driven voice cloning for an intimate, personalized moment; designed for a single participant (with others observing), it begins at a treasure chest that symbolically links the tales The Golden Key and The Puppet-Show Man, and this chat is actor meeting and is a meet-and-greet for characters from The Puppet-Show Man."';

    return [
      persona,
      "",
      `Standing question: "${seedQ}"`,
      "",
      "Recent context:",
      transcript,
      "",
      "INSTRUCTIONS:",
      "- Reply in a single short sentence unless the user asked for detail.",
      "- Sound natural and conversational (use contractions, light warmth).",
      "- Stay in character and on topic.",
      "- About 1 out of 3 times, end with a very short follow-up question that keeps the user talking, unless the user already asked a direct question.",
      chestRule,
      "",
      `User now says: "${userInput}"`,
      "Assistant:",
    ].join("\n");
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

  // ---------- ACTIVE AVATAR IMAGE SWITCH ----------
  let activeAvatarEl = null;

  function setActiveAvatar(newIdx) {
    if (activeAvatarEl) {
      const nodeList = Array.from(avatarEls);
      const prevIdx = Number(
        activeAvatarEl.dataset.idx ?? nodeList.indexOf(activeAvatarEl)
      );
      if (!Number.isNaN(prevIdx) && AVATAR_DEFAULT_SRC[prevIdx]) {
        activeAvatarEl.src = AVATAR_DEFAULT_SRC[prevIdx];
      }
      activeAvatarEl.classList.remove("is-active");
      activeAvatarEl.setAttribute("aria-pressed", "false");
    }

    const el = avatarEls[newIdx];
    if (!el) return;

    el.src = AVATAR_SELECTED_SRC[newIdx];
    el.classList.add("is-active");
    el.setAttribute("aria-pressed", "true");
    activeAvatarEl = el;
  }

  // ---------- AVATAR CLICK: switch name, theme, history, and image ----------
  avatarEls.forEach((img, idx) => {
    img.classList.add("is-clickable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      NAME_BY_INDEX[idx] || `Character ${idx + 1}`
    );
    img.setAttribute("data-idx", String(idx));
    img.setAttribute("aria-pressed", "false");

    const apply = () => {
      currentAvatar = idx;
      setCharName(NAME_BY_INDEX[idx] || "Character");
      applyTheme(idx);
      ensureInitialMessage(idx);
      renderHistory(idx);
      setActiveAvatar(idx);
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
  ensureInitialMessage(currentAvatar);
  renderHistory(currentAvatar);

  if (avatarEls[currentAvatar]) {
    avatarEls[currentAvatar].src = AVATAR_SELECTED_SRC[currentAvatar];
    avatarEls[currentAvatar].classList.add("is-active");
    avatarEls[currentAvatar].setAttribute("aria-pressed", "true");
    avatarEls[currentAvatar].setAttribute("data-idx", String(currentAvatar));
    activeAvatarEl = avatarEls[currentAvatar];
  }

  // ---------- SUBMIT HANDLER ----------
  function addSystemNote(text) {
    const div = document.createElement("div");
    div.className = "msg system";
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  if (formEl && inputEl && messagesEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userText = inputEl.value.trim();
      if (!userText) return;

      pushAndRender("user", userText);
      inputEl.value = "";
      inputEl.focus();

      // lightweight “Thinking…” while server responds
      const thinking = document.createElement("div");
      thinking.className = "msg system typing";
      thinking.textContent = "Thinking…";
      messagesEl.appendChild(thinking);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      const packedPrompt = buildPromptForModel(currentAvatar, userText);
      const aiText = await fetchAIResponse(packedPrompt);

      thinking.remove();

      // human-like delivery
      await simulateHumanAIResponse(aiText);
    });

    // addSystemNote("Welcome! Pick a character above and start chatting.");
  }

  // ---------- MOBILE TWEAK: keep chat visible while typing ----------
  if (inputEl) {
    inputEl.addEventListener("focus", () => {
      setTimeout(() => {
        const chat = document.querySelector(".chat");
        if (chat) chat.scrollTop = chat.scrollHeight;
      }, 300);
    });
    inputEl.addEventListener("blur", () => {
      const chat = document.querySelector(".chat");
      if (chat) chat.scrollTop = chat.scrollHeight;
    });
  }
});
