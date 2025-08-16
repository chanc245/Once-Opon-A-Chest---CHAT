// ---------- TERMINAL ---------- //
// ---------- TERMINAL ---------- //
// ---------- TERMINAL ---------- //
// ---------- TERMINAL ---------- //
// ---------- TERMINAL ---------- //

// github('jcubic/jquery.terminal');
document.fonts.ready.then(() => {
  const term = $("#commandDiv").terminal(
    {
      start: async function () {
        // loadPuzzle.call(this);
      },
      processInput: async function (input) {
        const prompt = evaluationPrompt(otherInput, input);

        const aiResponse = await fetchAIResponse(prompt);

        this.echo(`\n[AI]
  ${aiResponse}
`);
      },
    },
    {
      greetings: `Welcome to AI Chatbot example in jquery.terminal!

See /public/prompt.js to update the prompt you’re using. Otherwise, the AI will answer questions based on the current prompt!
`,
      prompt: "> ",
      onInit: function () {
        this.push(async function (input) {
          const prompt = evaluationPrompt(otherInput, input);
          const aiResponse = await fetchAIResponse(prompt);
          this.echo(`\n[AI]
  ${aiResponse}
`);
        });
      },
    }
  );
});

// ---------- AI ---------- //
// ---------- AI ---------- //
// ---------- AI ---------- //
// ---------- AI ---------- //
// ---------- AI ---------- //

async function fetchAIResponse(input) {
  console.log(`--fetchAIResponse started --input: ${input}`);

  try {
    const response = await fetch("/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (response.ok) {
      console.log("--AI response OK");
      const jsonData = await response.json();
      const aiModResponse = jsonData.ai;

      console.log(`==Gemini Output: ${aiModResponse}`);
      return aiModResponse;
    } else {
      console.error(
        "Error in API request:",
        response.status,
        response.statusText
      );
      return `Error in API request: ${response.status} ${response.statusText}`;
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Oops, something went wrong. Let's try again!";
  }
}
