// A tiny home-only enhancement; the prompt remains readable without JavaScript.
const button = document.querySelector("[data-copy-prompt]");
const prompt = document.getElementById("sp-start-prompt");
const status = document.getElementById("sp-copy-status");

if (button && prompt && status) {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(prompt.value);
      button.textContent = "Prompt copied";
      status.textContent = "Paste it into your coding agent to get started.";
    } catch {
      prompt.closest("details").open = true;
      prompt.focus();
      prompt.select();
      status.textContent =
        "Select and copy the prompt below, then paste it into your coding agent.";
    }
  });
}
