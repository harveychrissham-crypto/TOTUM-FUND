const functions = require("firebase-functions");
const fetch = require("node-fetch");

const GEMINI_API_KEY = functions.config().gemini.key;

exports.gemini = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).send("Missing prompt");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      systemInstruction: { parts: [{ text: "You are a helpful financial assistant for Totum Fund users." }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await r.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return res.json({ text });
  } catch (err) {
    return res.status(500).send("Server error");
  }
});
