import { c as create_ssr_component, o as onDestroy } from "../../../chunks/ssr.js";
import { e as escape } from "../../../chunks/escape.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let output = "Warte auf Browser...";
  let encoder = null;
  onDestroy(() => {
    try {
      encoder?.free();
    } catch {
    }
    encoder = null;
  });
  return `${$$result.head += `<!-- HEAD_svelte-1hggqw9_START -->${$$result.title = `<title>Ltoken Debug</title>`, ""}<!-- HEAD_svelte-1hggqw9_END -->`, ""} <div style="padding: 2rem; font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.8; background: #111; color: #e0e0e0; min-height: 100vh; white-space: pre-wrap;"><div style="color: #FAC775; margin-bottom: 1rem; font-size: 16px; font-family: sans-serif;" data-svelte-h="svelte-9xo7ol">🔍 Ltoken Debug</div> ${escape(output)}</div>`;
});
export {
  Page as default
};
