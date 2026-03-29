import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzePlan(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockAnalysis(prompt);
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert project planning AI. Analyze the user's project description and return ONLY a valid JSON object with no markdown, no explanation, just the raw JSON.`,
    messages: [{
      role: 'user',
      content: `Analyze this project and return a JSON object with exactly these fields:
{
  "industry": "technology|healthcare|finance|education|construction|retail|media|consulting|manufacturing|other",
  "projectName": "string - clear professional project name",
  "projectDescription": "string - 2-3 sentence description",
  "complexity": "simple|medium|complex",
  "estimatedDurationWeeks": number,
  "keyAreas": ["string array of 3-6 major focus areas"],
  "requiredSkills": ["string array of skills needed"],
  "requiredDepartments": [
    {
      "name": "Department Name",
      "description": "What this dept does",
      "roles": [
        { "title": "Job Title", "skills": ["skill1","skill2"], "count": 1 }
      ]
    }
  ],
  "suggestedTools": [
    { "name": "Tool Name", "category": "design|development|communication|testing|analytics|cms|hosting|other", "purpose": "why this tool" }
  ],
  "risks": ["string array of 3-5 project risks"],
  "priority": "critical|high|medium|low"
}

Project description: "${prompt}"`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
}

function getMockAnalysis(prompt) {
  const lower = prompt.toLowerCase();
  const isWeb = lower.includes('website') || lower.includes('web');
  const isMobile = lower.includes('mobile') || lower.includes('app');
  const isHealthcare = lower.includes('health') || lower.includes('medical');

  const industry = isHealthcare ? 'healthcare' : 'technology';

  return {
    industry,
    projectName: prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt,
    projectDescription: `A comprehensive ${isWeb ? 'web' : isMobile ? 'mobile' : 'software'} project requiring cross-functional team collaboration and structured delivery.`,
    complexity: 'medium',
    estimatedDurationWeeks: 8,
    keyAreas: ['Planning & Architecture', 'Design', 'Development', 'Testing', 'Deployment'],
    requiredSkills: ['Project Management', 'UI/UX Design', 'Frontend Development', 'Backend Development', 'QA Testing'],
    requiredDepartments: [
      { name: 'Project Management', description: 'Coordinates project delivery', roles: [{ title: 'Project Manager', skills: ['Planning', 'Communication'], count: 1 }] },
      { name: 'Design', description: 'Creates visual and UX assets', roles: [{ title: 'UI/UX Designer', skills: ['Figma', 'CSS'], count: 1 }] },
      { name: 'Development', description: 'Builds the software', roles: [{ title: 'Frontend Developer', skills: ['React', 'JavaScript'], count: 1 }, { title: 'Backend Developer', skills: ['Node.js', 'MongoDB'], count: 1 }] },
      { name: 'QA', description: 'Ensures software quality', roles: [{ title: 'QA Engineer', skills: ['Testing', 'Automation'], count: 1 }] }
    ],
    suggestedTools: [
      { name: 'Figma', category: 'design', purpose: 'UI/UX Design' },
      { name: 'GitHub', category: 'development', purpose: 'Version control' },
      { name: 'Vercel', category: 'hosting', purpose: 'Deployment' }
    ],
    risks: ['Scope creep', 'Timeline delays', 'Technical debt', 'Resource availability'],
    priority: 'high'
  };
}
