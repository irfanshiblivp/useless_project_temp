import express from 'express';
import fetch from 'node-fetch'; // or global fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not set in environment.");
}

function buildPrompt(code, languageHint = 'auto') {
  return `You are an expert code reviewer and analyzer.

1) Determine if the input is actually source code or not. If not code, respond exactly: "INPUT IS NOT PROGRAMMING CODE."

2) If it is code, analyze it carefully and list any issues found with each issue marked clearly with a severity label from: very low, low, medium, high, very high.

3) For each issue, provide:
  - The error description
  - The severity level (from above)
  - Exact line numbers or code snippets if applicable

4) Format your response as valid JSON ONLY, with two keys:
{
  "isCode": true or false,
  "issues": [
    {
      "line": number or null,
      "severity": "very low" | "low" | "medium" | "high" | "very high",
      "description": "string"
    },
    ...
  ],
  "message": "A short summary message"
}

If no issues found, return issues as empty array and message as "No issues found."

Language hint: ${languageHint}

Code input:
\`\`\`
${code}
\`\`\`
`;
}

// Remove code fences like ```json ... ``` or ``` ... ```
function stripCodeFences(text) {
  return text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
}

app.post('/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') return res.status(400).json({ error: 'Missing code string' });

    const payload = {
      contents: [
        {
          parts: [
            { text: buildPrompt(code) }
          ]
        }
      ]
    };

    const apiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Gemini API error', apiRes.status, errText);
      return res.status(500).json({ error: `Gemini API error: ${apiRes.status}`, detail: errText });
    }

    const apiJson = await apiRes.json();
    let text = apiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) {
      return res.status(502).json({ error: 'No text returned from Gemini', raw: apiJson });
    }

    text = stripCodeFences(text).trim();

    // Gemini returns a JSON string as text, so parse it safely:
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // Return error with raw text for debugging
      return res.status(502).json({
        error: 'Failed to parse Gemini JSON response',
        raw: text
      });
    }

    if (typeof parsed.isCode !== 'boolean' || !Array.isArray(parsed.issues) || typeof parsed.message !== 'string') {
      return res.status(502).json({ error: 'Invalid JSON structure from Gemini', raw: parsed });
    }

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
