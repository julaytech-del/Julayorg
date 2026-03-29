import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateTasks(planAnalysis) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockTasks(planAnalysis);
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are an expert project manager. Generate a complete project task breakdown and return ONLY valid JSON with no markdown or explanation.`,
    messages: [{
      role: 'user',
      content: `Generate a complete project breakdown for: "${planAnalysis.projectName}"
Industry: ${planAnalysis.industry}
Complexity: ${planAnalysis.complexity}
Duration: ${planAnalysis.estimatedDurationWeeks} weeks
Key areas: ${planAnalysis.keyAreas.join(', ')}

Return JSON with this exact structure:
{
  "goals": [
    {
      "title": "Goal/Phase Name",
      "description": "What this phase accomplishes",
      "order": 1,
      "dueOffsetWeeks": 2,
      "color": "#hexcolor",
      "tasks": [
        {
          "title": "Task title",
          "description": "Detailed task description",
          "type": "feature|design|research|planning|meeting|review|deployment|content|testing|bug|other",
          "priority": "critical|high|medium|low",
          "estimatedHours": 8,
          "skillsRequired": ["skill1"],
          "tools": [{"name": "ToolName", "category": "design|development|testing|analytics|other", "url": "url.com", "description": "why this tool"}],
          "subtasks": [{"title": "subtask description"}],
          "dueOffsetDays": 7,
          "departmentHint": "Design|Development|Marketing|etc"
        }
      ]
    }
  ]
}

Create ${Math.min(Math.max(planAnalysis.estimatedDurationWeeks / 2, 4), 7)} goals/phases.
Each goal should have 3-6 tasks. Total tasks: 20-35.
Make tasks specific, actionable, and realistic for ${planAnalysis.industry} industry.`
    }]
  });

  const content = message.content[0].text.trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
}

function getMockTasks(planAnalysis) {
  return {
    goals: [
      {
        title: 'Requirements & Planning',
        description: 'Define project scope, gather requirements, and plan the architecture',
        order: 1, dueOffsetWeeks: 1, color: '#6366F1',
        tasks: [
          { title: 'Stakeholder Requirements Workshop', description: 'Conduct workshops to gather and document all stakeholder requirements', type: 'meeting', priority: 'high', estimatedHours: 8, skillsRequired: ['Communication', 'Planning'], tools: [], subtasks: [{ title: 'Prepare workshop agenda' }, { title: 'Conduct meeting' }, { title: 'Document requirements' }, { title: 'Get stakeholder sign-off' }], dueOffsetDays: 3, departmentHint: 'Project Management' },
          { title: 'Technical Architecture Planning', description: 'Define the technical stack, database schema, and system architecture', type: 'planning', priority: 'critical', estimatedHours: 12, skillsRequired: ['System Design', 'Architecture'], tools: [{ name: 'Lucidchart', category: 'design', url: 'lucidchart.com', description: 'Diagram and architecture tool' }], subtasks: [{ title: 'Define tech stack' }, { title: 'Plan database schema' }, { title: 'Create architecture diagram' }], dueOffsetDays: 5, departmentHint: 'Development' },
          { title: 'Project Repository Setup', description: 'Initialize version control, CI/CD pipelines, and development environments', type: 'planning', priority: 'high', estimatedHours: 4, skillsRequired: ['DevOps', 'Git'], tools: [{ name: 'GitHub', category: 'development', url: 'github.com', description: 'Source code management and CI/CD' }], subtasks: [{ title: 'Initialize repository' }, { title: 'Configure CI/CD pipeline' }, { title: 'Set up environments' }], dueOffsetDays: 7, departmentHint: 'Development' }
        ]
      },
      {
        title: 'UI/UX Design',
        description: 'Create wireframes, mockups, and design system',
        order: 2, dueOffsetWeeks: 3, color: '#EC4899',
        tasks: [
          { title: 'Brand Identity & Style Guide', description: 'Define color palette, typography, and component design system', type: 'design', priority: 'high', estimatedHours: 24, skillsRequired: ['UI Design', 'Branding'], tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'Professional UI/UX design tool' }], subtasks: [{ title: 'Define color palette' }, { title: 'Typography system' }, { title: 'Component library' }, { title: 'Export design tokens' }], dueOffsetDays: 14, departmentHint: 'Design' },
          { title: 'Wireframes - All Pages', description: 'Create low-fidelity wireframes for all major pages and user flows', type: 'design', priority: 'high', estimatedHours: 32, skillsRequired: ['Wireframing', 'UX'], tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'Wireframing and prototyping' }], subtasks: [{ title: 'Homepage wireframe' }, { title: 'Inner pages wireframes' }, { title: 'Mobile responsive layouts' }, { title: 'User flow diagrams' }], dueOffsetDays: 18, departmentHint: 'Design' },
          { title: 'High-Fidelity Mockups & Prototype', description: 'Create pixel-perfect designs and interactive prototype for stakeholder review', type: 'design', priority: 'high', estimatedHours: 40, skillsRequired: ['UI Design', 'Prototyping'], tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'High-fidelity design and prototyping' }], subtasks: [{ title: 'Desktop designs' }, { title: 'Mobile designs' }, { title: 'Interactive prototype' }, { title: 'Design review & approval' }], dueOffsetDays: 21, departmentHint: 'Design' }
        ]
      },
      {
        title: 'Core Development',
        description: 'Build the main application features and functionality',
        order: 3, dueOffsetWeeks: 6, color: '#10B981',
        tasks: [
          { title: 'Frontend Scaffolding & Core Setup', description: 'Set up the frontend framework, routing, state management, and base components', type: 'feature', priority: 'critical', estimatedHours: 16, skillsRequired: ['React', 'JavaScript'], tools: [{ name: 'React', category: 'development', url: 'react.dev', description: 'Frontend framework' }, { name: 'Vite', category: 'development', url: 'vitejs.dev', description: 'Build tool' }], subtasks: [{ title: 'Initialize React project' }, { title: 'Configure routing' }, { title: 'Set up state management' }, { title: 'Create base layout' }], dueOffsetDays: 28, departmentHint: 'Development' },
          { title: 'Homepage & Landing Page', description: 'Develop the homepage with all sections, animations, and responsive design', type: 'feature', priority: 'high', estimatedHours: 24, skillsRequired: ['React', 'CSS', 'Animation'], tools: [], subtasks: [{ title: 'Hero section' }, { title: 'Features section' }, { title: 'Testimonials section' }, { title: 'CTA section' }], dueOffsetDays: 35, departmentHint: 'Development' },
          { title: 'Inner Pages Development', description: 'Develop all inner pages: About, Services, Portfolio, Blog, Contact', type: 'feature', priority: 'high', estimatedHours: 40, skillsRequired: ['React', 'CSS'], tools: [], subtasks: [{ title: 'About page' }, { title: 'Services page' }, { title: 'Contact page' }, { title: 'Blog listing & detail pages' }], dueOffsetDays: 42, departmentHint: 'Development' },
          { title: 'Backend API & CMS Integration', description: 'Set up headless CMS, develop APIs for contact forms and dynamic content', type: 'feature', priority: 'high', estimatedHours: 32, skillsRequired: ['Node.js', 'API Design'], tools: [{ name: 'Strapi', category: 'development', url: 'strapi.io', description: 'Headless CMS' }], subtasks: [{ title: 'CMS setup and configuration' }, { title: 'Contact form API' }, { title: 'Blog/content API' }, { title: 'Email integration' }], dueOffsetDays: 42, departmentHint: 'Development' }
        ]
      },
      {
        title: 'Content & SEO',
        description: 'Create all content, optimize for search engines',
        order: 4, dueOffsetWeeks: 7, color: '#F59E0B',
        tasks: [
          { title: 'Copywriting - All Pages', description: 'Write compelling copy for all website pages aligned with brand voice', type: 'content', priority: 'high', estimatedHours: 32, skillsRequired: ['Copywriting', 'SEO Writing'], tools: [{ name: 'Grammarly', category: 'other', url: 'grammarly.com', description: 'Writing assistant' }], subtasks: [{ title: 'Homepage copy' }, { title: 'About page copy' }, { title: 'Services descriptions' }, { title: 'Blog posts (5 articles)' }], dueOffsetDays: 45, departmentHint: 'Marketing' },
          { title: 'SEO Implementation', description: 'Implement on-page SEO, meta tags, sitemap, structured data', type: 'feature', priority: 'high', estimatedHours: 16, skillsRequired: ['SEO', 'Technical SEO'], tools: [{ name: 'Google Search Console', category: 'analytics', url: 'search.google.com/search-console', description: 'SEO monitoring' }, { name: 'Ahrefs', category: 'analytics', url: 'ahrefs.com', description: 'SEO analysis' }], subtasks: [{ title: 'Keyword research' }, { title: 'Meta tags optimization' }, { title: 'XML sitemap' }, { title: 'Structured data markup' }], dueOffsetDays: 49, departmentHint: 'Marketing' }
        ]
      },
      {
        title: 'Testing & Quality Assurance',
        description: 'Comprehensive testing across all devices and browsers',
        order: 5, dueOffsetWeeks: 8, color: '#EF4444',
        tasks: [
          { title: 'Cross-Browser & Device Testing', description: 'Test on all major browsers and devices, fix compatibility issues', type: 'testing', priority: 'critical', estimatedHours: 24, skillsRequired: ['QA Testing', 'Browser Testing'], tools: [{ name: 'BrowserStack', category: 'testing', url: 'browserstack.com', description: 'Cross-browser testing' }, { name: 'Cypress', category: 'testing', url: 'cypress.io', description: 'E2E testing framework' }], subtasks: [{ title: 'Desktop browser testing' }, { title: 'Mobile device testing' }, { title: 'Performance testing' }, { title: 'Accessibility audit' }], dueOffsetDays: 52, departmentHint: 'Development' },
          { title: 'Performance & Security Audit', description: 'Optimize page speed, implement security headers, run vulnerability scan', type: 'testing', priority: 'high', estimatedHours: 12, skillsRequired: ['Performance Optimization', 'Security'], tools: [{ name: 'Lighthouse', category: 'testing', url: 'developers.google.com/web/tools/lighthouse', description: 'Performance auditing' }], subtasks: [{ title: 'Lighthouse audit & fixes' }, { title: 'Security headers' }, { title: 'Image optimization' }], dueOffsetDays: 54, departmentHint: 'Development' },
          { title: 'Launch & Deployment', description: 'Deploy to production, configure CDN, DNS, SSL, and monitoring', type: 'deployment', priority: 'critical', estimatedHours: 8, skillsRequired: ['DevOps', 'Cloud Deployment'], tools: [{ name: 'Vercel', category: 'development', url: 'vercel.com', description: 'Frontend hosting and deployment' }, { name: 'Google Analytics', category: 'analytics', url: 'analytics.google.com', description: 'Traffic analytics' }], subtasks: [{ title: 'Production deployment' }, { title: 'DNS configuration' }, { title: 'SSL setup' }, { title: 'Analytics integration' }, { title: 'Post-launch monitoring' }], dueOffsetDays: 56, departmentHint: 'Development' }
        ]
      }
    ]
  };
}
