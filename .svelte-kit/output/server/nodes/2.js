

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.CDrPFO4k.js","_app/immutable/chunks/Cuw_VhVy.js","_app/immutable/chunks/BmzIhm5K.js","_app/immutable/chunks/Cjf4pfOQ.js","_app/immutable/chunks/C1FmrZbK.js"];
export const stylesheets = ["_app/immutable/assets/2.BQxg35jr.css"];
export const fonts = [];
