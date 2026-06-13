import { createMessage } from './claude.js';

export async function analyzeFormSubmissions(formName, fields, submissions) {
  // Format submissions for the prompt
  const formatted = submissions.map((sub, i) => {
    const entries = Object.entries(sub.data || {}).map(([k, v]) => {
      const field = fields.find(f => f.id === k);
      return `${field?.label || k}: ${v}`;
    }).join('\n');
    return `Submission ${i + 1}:\n${entries}`;
  }).join('\n\n---\n\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    return { summary: 'AI analysis not available.', themes: [], actionItems: [], sentiment: 'neutral' };
  }

  const message = await createMessage({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: 'You are a feedback analysis expert. Analyze form submissions and return ONLY valid JSON, no markdown.',
    messages: [{
      role: 'user',
      content: `Analyze these ${submissions.length} submissions for the form "${formName}" and return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence overall summary of all feedback",
  "sentiment": "positive|neutral|negative|mixed",
  "sentimentScore": number between 0-100 (100 = very positive),
  "themes": [
    { "title": "Theme name", "count": number, "description": "brief description" }
  ],
  "actionItems": [
    { "priority": "high|medium|low", "text": "specific actionable recommendation" }
  ],
  "keyInsights": ["string array of 3-5 key insights"],
  "commonIssues": ["string array of recurring problems mentioned"]
}

Submissions:
${formatted}`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
}
