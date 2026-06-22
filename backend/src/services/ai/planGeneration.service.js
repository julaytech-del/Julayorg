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

  try {
    const message = await createMessage({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: `You are an expert project planning AI. Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just the raw JSON.`,
      messages: [{
        role: 'user',
        content: `Analyze this project and produce a complete plan in ONE JSON object with exactly this shape:
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

Create exactly 5 goals. Each goal has 3-4 tasks (total 15-20 tasks). Keep all descriptions concise.

Project description: "${prompt}"`
      }]
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    const { goals, ...analysis } = parsed;
    if (!Array.isArray(goals) || goals.length === 0) throw new Error('combined plan returned no goals');
    if (!analysis.projectName) throw new Error('combined plan missing analysis fields');

    return { analysis, goals };
  } catch (e) {
    console.error('[ai] combined plan failed, falling back to two-step:', e.message);
    return twoStep(prompt);
  }
}

async function twoStep(prompt) {
  const analysis = await analyzePlan(prompt);
  const { goals } = await generateTasks(analysis);
  return { analysis, goals };
}
