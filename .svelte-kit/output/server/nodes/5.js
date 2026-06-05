

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/embed/_page.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/embed/+page.ts";
export const imports = ["_app/immutable/nodes/5.B75hfMfm.js","_app/immutable/chunks/Cuw_VhVy.js","_app/immutable/chunks/BmzIhm5K.js","_app/immutable/chunks/Cjf4pfOQ.js","_app/immutable/chunks/C1FmrZbK.js"];
export const stylesheets = ["_app/immutable/assets/5.DmZOnOOr.css"];
export const fonts = [];
