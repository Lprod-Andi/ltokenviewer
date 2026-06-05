

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/compare/_page.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/compare/+page.ts";
export const imports = ["_app/immutable/nodes/3.C_bj5Yk8.js","_app/immutable/chunks/Cuw_VhVy.js","_app/immutable/chunks/BmzIhm5K.js","_app/immutable/chunks/Cjf4pfOQ.js","_app/immutable/chunks/C1FmrZbK.js"];
export const stylesheets = ["_app/immutable/assets/3.CgatJwNz.css"];
export const fonts = [];
