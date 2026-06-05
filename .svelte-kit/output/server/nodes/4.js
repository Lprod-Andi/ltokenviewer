

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/debug/_page.svelte.js')).default;
export const universal = {
  "ssr": false,
  "load": null
};
export const universal_id = "src/routes/debug/+page.ts";
export const imports = ["_app/immutable/nodes/4.EYCyCdAY.js","_app/immutable/chunks/OA8UcISh.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/Cuw_VhVy.js","_app/immutable/chunks/BmzIhm5K.js"];
export const stylesheets = [];
export const fonts = [];
