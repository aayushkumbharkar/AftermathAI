import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── System Prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior operator, product thinker, and systems architect with real-world experience.

You analyze decisions by simulating consequences. You are critical, precise, and realistic. You do not motivate or validate the user.

You focus on:
- second-order effects
- failure modes
- constraints
- trade-offs

Avoid generic statements.`;

// ── User Prompt Template ───────────────────────────────────────────────────────

function buildUserPrompt(decision) {
  return `Analyze the following decision:

"${decision}"

Structure your response exactly as:

Direct Outcome:
...

Second-Order Effects:
- ...
- ...
- ...
- ...

Failure Points:
- ...
- ...
- ...

Hidden Assumptions:
- ...
- ...
- ...

What You're Underestimating:
...

Long-Term Consequences:
...

Pattern Recognition:
...

Failure Timeline:
- Early Stage:
- Mid Stage:
- Late Stage:

Self-Critique:
...

Rules:
- Be specific
- Be critical
- Avoid vague language
- No motivational tone
- No generic filler`;
}

// ── Provider: Groq (Primary) ───────────────────────────────────────────────────

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

async function callGroq(userPrompt) {
  if (!groqClient) {
    throw new Error("Groq API key not configured");
  }

  const start = performance.now();

  const completion = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const latency = Math.round(performance.now() - start);
  const text = completion.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Groq returned empty response");
  }

  return { text, latency };
}

// ── Provider: Gemini (Fallback) ────────────────────────────────────────────────

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

async function callGemini(userPrompt) {
  if (!geminiClient) {
    throw new Error("Gemini API key not configured");
  }

  const start = performance.now();

  const model = geminiClient.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  const latency = Math.round(performance.now() - start);

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return { text, latency };
}

// ── Fallback Router ────────────────────────────────────────────────────────────

const providers = [
  { name: "groq", fn: callGroq, available: !!groqClient },
  { name: "gemini", fn: callGemini, available: !!geminiClient },
];

async function routeInference(userPrompt) {
  const errors = [];

  for (const provider of providers) {
    if (!provider.available) {
      errors.push({ provider: provider.name, error: "not configured" });
      continue;
    }

    try {
      console.log(`[inference] attempting provider: ${provider.name}`);
      const { text, latency } = await provider.fn(userPrompt);
      console.log(
        `[inference] ✓ ${provider.name} responded in ${latency}ms`
      );
      return {
        analysis: text,
        provider: provider.name,
        latencyMs: latency,
        fallbackUsed: provider.name !== "groq",
      };
    } catch (err) {
      const reason =
        err?.status === 429
          ? "rate limited"
          : err?.message || "unknown error";
      console.warn(`[inference] ✗ ${provider.name} failed: ${reason}`);
      errors.push({ provider: provider.name, error: reason });
    }
  }

  // All providers failed
  const summary = errors
    .map((e) => `${e.provider}: ${e.error}`)
    .join("; ");
  throw new Error(`All inference providers failed — ${summary}`);
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.post("/analyze", async (req, res) => {
  const { decision } = req.body;

  if (!decision || decision.trim().length === 0) {
    return res.status(400).json({ error: "Decision text is required." });
  }

  try {
    const userPrompt = buildUserPrompt(decision.trim());
    const result = await routeInference(userPrompt);
    res.json(result);
  } catch (err) {
    console.error("[analyze] error:", err.message);
    res.status(500).json({
      error: err.message || "Analysis failed. Please try again.",
    });
  }
});

app.get("/health", (req, res) => {
  const status = {
    status: "ok",
    providers: providers.map((p) => ({
      name: p.name,
      configured: p.available,
    })),
  };
  res.json(status);
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\nAftermath AI backend running on http://localhost:${PORT}\n`);
  console.log("Provider status:");
  providers.forEach((p) => {
    const icon = p.available ? "✓" : "✗";
    const label = p.available ? "ready" : "not configured";
    console.log(`  ${icon} ${p.name}: ${label}`);
  });
  console.log("");
});
