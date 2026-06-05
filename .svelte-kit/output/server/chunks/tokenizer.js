const EMPTY = { tokenCount: 0, charCount: 0, wordCount: 0, chunks: [] };
const encodingCache = /* @__PURE__ */ new Map();
let consumerCount = 0;
function releaseEncoders() {
  consumerCount--;
  if (consumerCount <= 0) {
    consumerCount = 0;
    encodingCache.clear();
  }
}
new TextDecoder("utf-8", { fatal: false });
async function tokenizeText(text, model) {
  return EMPTY;
}
export {
  releaseEncoders as r,
  tokenizeText as t
};
