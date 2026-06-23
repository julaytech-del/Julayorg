import { createMessage } from './claude.js';
import { analyzePlan } from './planAnalysis.service.js';
import { generateTasks } from './taskGeneration.service.js';

// Combined analysis + task breakdown in a SINGLE Claude call. Previously this was
// two sequential calls (analyze -> tasks), which roughly doubled latency and made
// generation take 100s+. The model already reasons about the project to break it
// into tasks, so producing the few analysis fields in the same response is nearly
// free. Falls back to the proven two-step path if the single call can't be parsed.
export async function generateFullPlan(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return twoStep(prompt);
  }

  let parsed;
  try {
    const message = await createMessage({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: `You are an expert project planning AI. Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just the raw JSON.`,
      messages: [{
        role: 'user',
        content: `First decide if the text below is a real, understandable description of a project to build, launch, or manage. If it is gibberish, random characters, keyboard mashing, meaningless, or you cannot tell what project is wanted, respond with ONLY this and nothing else: {"error":"unclear"}

Otherwise, analyze the project and produce a complete plan in ONE JSON object with exactly this shape:
{
  "industry": "technology|healthcare|finance|education|construction|retail|media|consulting|manufacturing|other",
  "projectName": "clear professional project name",
  "projectDescription": "2-3 sentence description",
  "complexity": "simple|medium|complex",
  "estimatedDurationWeeks": number,
  "priority": "critical|high|medium|low",
  "goals": [
    {
      "title": "string",
      "description": "string (under 100 chars)",
      "order": 1,
      "dueOffsetWeeks": 2,
      "color": "#6366F1",
      "tasks": [
        {
          "title": "string",
          "description": "string (under 100 chars)",
          "type": "feature|design|testing|deployment|content|planning|meeting|other",
          "priority": "critical|high|medium|low",
          "estimatedHours": 8,
          "skillsRequired": ["skill"],
          "tools": [{ "name": "Tool", "category": "design|development|communication|testing|analytics|cms|hosting|other", "url": "url.com", "description": "why" }],
          "subtasks": [{ "title": "subtask" }],
          "dueOffsetDays": 7,
          "departmentHint": "Development"
        }
      ]
    }
  ]
}

Create exactly 4 goals. Each goal has exactly 3 tasks (12 tasks total). Use at most 2 subtasks per task. Keep every description very short (under 80 chars). Be concise to respond fast.

Project description: "${prompt}"`
      }]
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    // Network/parse failure → fall back to the proven two-step path.
    console.error('[ai] combined plan failed, falling back to two-step:', e.message);
    return twoStep(prompt);
  }

  // Model judged the input as gibberish/unclear — surface to the user, do NOT
  // fall back (we don't want to fabricate a plan from nonsense or burn tokens).
  if (parsed && parsed.error) {
    const err = new Error('We couldn’t understand that description. Please describe your project in a clear sentence — e.g. "Launch a food delivery app for a restaurant chain".');
    err.code = 'INVALID_PROMPT';
    err.statusCode = 400;
    throw err;
  }

  const { goals, ...analysis } = parsed;
  // Malformed but not explicitly flagged → fall back to the proven path.
  if (!Array.isArray(goals) || goals.length === 0 || !analysis.projectName) {
    return twoStep(prompt);
  }

  return { analysis, goals };
}

async function twoStep(prompt) {
  const analysis = await analyzePlan(prompt);
  const { goals } = await generateTasks(analysis);
  return { analysis, goals };
}
