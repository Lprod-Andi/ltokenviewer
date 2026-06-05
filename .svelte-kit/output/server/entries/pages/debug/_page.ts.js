import { error } from "@sveltejs/kit";
const ssr = false;
function load() {
  throw error(404, "Not found");
}
export {
  load,
  ssr
};
