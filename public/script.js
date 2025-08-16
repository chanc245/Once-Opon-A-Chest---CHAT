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
    // Ballerina
    {
      aiBg: "var(--char1-yellow-dark)",
      aiText: "var(--visitor-gray-dark)",
      chatbox: "var(--char1-yellow-light)",
      nameColor: "var(--visitor-gray-dark)",
    },
    // Acrobat
    {
      aiBg: "var(--char2-purple-dark)",
      aiText: "var(--char2-purple-light)",
      chatbox: "var(--char2-purple-light)",
      nameColor: "var(--char2-purple-dark)",
    },
    // Pirates
    {
      aiBg: "var(--char3-blue-dark)",
      aiText: "var(--char3-blue-light)",
      chatbox: "var(--char3-blue-light)",
      nameColor: "var(--char3-blue-dark)",
    },
    // Traveler
    {
      aiBg: "var(--char4-green-dark)",
      aiText: "var(--char4-green-light)",
      chatbox: "var(--char4-green-light)",
      nameColor: "var(--char4-green-dark)",
    },
    // Apprentice
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

  // ---------- AVATAR → CHARACTER NAME ----------
  const NAME_BY_INDEX = [
    "---------- Ballerina ----------",
    "---------- Acrobat ----------",
    "---------- Pirates ----------",
    "---------- Traveler ----------",
    "---------- Apprentice ----------",
  ];
  const charNameEl = document.getElementById("char_name");

  function setCharName(name) {
    if (charNameEl) charNameEl.textContent = name;
  }

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
      setCharName(NAME_BY_INDEX[idx] || "Character");
      applyTheme(idx);
    };

    img.addEventListener("click", apply);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        apply();
      }
    });
  });

  // ---------- SIMPLE WEB CHAT ----------
  const otherInput = `1 + 1 = 2`;
  const evaluationPrompt = (additionalInput, userInput) =>
    `This is the user input: "${userInput}"

say this is a test and this: ${additionalInput}. and user input.
`;

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

  if (formEl && inputEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userText = inputEl.value.trim();
      if (!userText) return;

      addMessage(userText, "user");
      inputEl.value = "";
      inputEl.focus();

      const prompt = evaluationPrompt(otherInput, userText);

      const typingNote = document.createElement("div");
      typingNote.className = "msg system";
      typingNote.textContent = "Thinking…";
      messagesEl.appendChild(typingNote);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      const aiText = await fetchAIResponse(prompt);

      typingNote.remove();
      addMessage(aiText, "ai");
    });

    addSystemNote("Welcome! Ask me anything.");
  }
});
