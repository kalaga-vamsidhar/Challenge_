/**
 * rscTrimmer.js
 *
 * Parses a Next.js RSC (React Server Components) streaming dump and extracts
 * only the human-readable text, in true render order — by following the
 * "$L<id>" / "$<id>" reference graph from the root chunk, NOT by trusting
 * the physical line order of the raw dump (which is not guaranteed to match
 * visual/DOM order).
 */

// Only these keys carry real structure/content. Everything else (className,
// componentKey, viewTrackingSpecs, url, title, style, action, ...) is
// styling/tracking/navigation metadata and is ignored outright.
const STRUCTURAL_KEYS = new Set([
  "children",
  "initialContent",
  "item",
  "items",
  "initialItems",
  "textProps",
]);

// Matches "$L6", "$6", "$L1f" etc. -> capture the referenced chunk id.
const REF_RE = /^\$L?([0-9a-fA-F]+)$/;

function resolveRef(str) {
  const m = REF_RE.exec(str);
  return m ? m[1] : null;
}

/**
 * Parse the raw RSC dump text into a { chunkId: parsedJSON } map.
 * Order of lines in the input does NOT matter.
 */
function loadChunks(rawText) {
  const chunks = {};
  const lines = rawText.split("\n");

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const chunkId = line.slice(0, idx);
    const payload = line.slice(idx + 1).trim();
    if (!payload) continue;

    // Module import lines, e.g.  1:I["030d...",[],"default"]  -> not content
    if (payload.startsWith("I[")) continue;

    // React fragment marker
    if (payload === '"$Sreact.fragment"') {
      chunks[chunkId] = null;
      continue;
    }

    try {
      chunks[chunkId] = JSON.parse(payload);
    } catch (e) {
      // Malformed/partial chunk (or genuinely not JSON) -> skip silently
      continue;
    }
  }

  return chunks;
}

/**
 * Depth-first walk over a parsed chunk tree, resolving "$Lx" references
 * on demand via the chunks map, and collecting plain-text content.
 */
function walk(obj, chunks, out, visited) {
  if (typeof obj === "string") {
    const refId = resolveRef(obj);
    if (refId !== null) {
      if (visited.has(refId) || !(refId in chunks)) return;
      visited.add(refId);
      walk(chunks[refId], chunks, out, visited);
      return;
    }
    const s = obj.trim();
    if (s && s !== "undefined" && s !== "$undefined" && !s.startsWith("$") && s.length > 1) {
      out.push(s);
    }
    return;
  }

  if (Array.isArray(obj)) {
    // React element tuple: ["$", type, key, props] -> only props matters
    if (obj.length >= 1 && obj[0] === "$") {
      if (obj.length >= 4 && obj[3] && typeof obj[3] === "object" && !Array.isArray(obj[3])) {
        walk(obj[3], chunks, out, visited);
      }
      return;
    }
    for (const item of obj) {
      walk(item, chunks, out, visited);
    }
    return;
  }

  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (STRUCTURAL_KEYS.has(key)) {
        walk(obj[key], chunks, out, visited);
      }
      // else: metadata key -> ignore entirely
    }
    return;
  }

  // number / boolean / null -> ignore
}

/**
 * Main entry point.
 * @param {string} rawText - the raw RSC dump (as posted by the client / fetched from the API)
 * @param {string} rootId - the chunk id to start walking from (usually "0")
 * @returns {string[]} array of text strings in true render order, de-duplicated
 *                      for consecutive repeats.
 */
function parseRscDump(rawText, rootId = "0") {
  const chunks = loadChunks(rawText);
  const out = [];
  const visited = new Set([rootId]);

  if (rootId in chunks) {
    walk(chunks[rootId], chunks, out, visited);
  } else {
    // Fallback: no clear root found -> best-effort walk of every chunk
    const ids = Object.keys(chunks).sort((a, b) => parseInt(a, 16) - parseInt(b, 16));
    for (const id of ids) {
      if (!visited.has(id)) {
        visited.add(id);
        walk(chunks[id], chunks, out, visited);
      }
    }
  }

  // De-duplicate consecutive repeats (skills blocks etc. sometimes repeat back-to-back)
  const deduped = [];
  for (const item of out) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== item) {
      deduped.push(item);
    }
  }
  return deduped;
}

module.exports = { parseRscDump, loadChunks };
