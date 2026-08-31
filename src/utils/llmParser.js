/**
 * llmParser.js
 *
 * Sends trimmed, sequential RSC text to Google Gemini (free tier) and asks
 * it to return structured JSON describing the profile experience entries.
 *
 * Requires: process.env.GEMINI_API_KEY
 * Get a free key at: https://aistudio.google.com/apikey
 */

// Model IDs shift over time as Google ships new versions — if this ever 404s again,
// check your live model list & free-tier eligibility at https://aistudio.google.com/
// (Models > "Free" filter) rather than guessing.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are a data-extraction engine. You will receive plain text extracted from a
LinkedIn profile's "Experience" section UI. The text is sequential: company name,
employment type/tenure, location, then for each role within that company: title,
dates, sometimes a skills line, sometimes attached media.

Extract this into structured JSON matching exactly this shape:

{
  "experiences": [
    {
      "company": string,
      "employment_type": string | null,
      "total_duration": string | null,
      "location": string | null,
      "roles": [
        {
          "title": string,
          "dates": string | null,
          "duration": string | null,
          "skills": string[] | null
        }
      ]
    }
  ]
}

Rules:
- Group consecutive roles under the same company together (a company can have multiple roles/promotions).
- "skills" should be parsed from lines like "JavaScript, Amazon CloudWatch and +9 skills" into an array of
  the named skills plus a note of the additional count if present, e.g. ["JavaScript", "Amazon CloudWatch", "+9 more"].
- If a field isn't present in the text, use null (or omit skills as null, not an empty array, if no skills line exists).
- Do not invent or guess any data not present in the input text.
- Return ONLY the JSON object. No markdown code fences, no preamble, no explanation.`;

/**
 * @param {string} cleanText - the trimmed, sequential text from parseRscDump().join("\n")
 * @returns {Promise<object>} parsed structured JSON object
 */
async function jsonifyUsingLlm(cleanText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey, // Google's current recommended auth pattern (works alongside legacy ?key=)
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nInput text:\n${cleanText}` }],
        },
      ],
      generationConfig: {
        // Forces Gemini to return valid JSON only -- no markdown fences to strip.
        responseMimeType: "application/json",
        // Note: Gemini 3.x docs recommend NOT overriding temperature/top_p/top_k --
        // reasoning is tuned for the defaults, so we leave it unset here.
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJsonText) {
    throw new Error("Gemini response missing expected content: " + JSON.stringify(data));
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch (e) {
    // Defensive fallback in case responseMimeType isn't honored for some reason
    const cleaned = rawJsonText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  return parsed;
}

module.exports = { jsonifyUsingLlm };