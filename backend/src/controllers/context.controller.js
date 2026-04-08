import Anthropic from '@anthropic-ai/sdk';
import Suggestion from '../models/Suggestion.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';

const anthropic = new Anthropic();

// Analyze shared text and generate suggestions
export const analyzeContext = async (req, res) => {
  try {
    const { text, projectId, source = { type: 'manual', label: 'Manual Share', icon: '📋' } } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'No text provided' });

    const orgId = req.user.organization?._id || req.user.organization;

    // Get project context
    let projectContext = '';
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId).populate('team.user', 'name jobTitle');
      const tasks = await Task.find({ project: projectId, status: { $ne: 'done' } }).limit(20).select('title status priority assignee');
      const goals = await Goal.find({ project: projectId }).limit(10).select('title status progress');

      projectContext = `
PROJECT: ${project?.name}
Description: ${project?.description}
Status: ${project?.status}
End Date: ${project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
Team: ${project?.team?.map(t => t.user?.name).join(', ')}

ACTIVE TASKS (${tasks.length}):
${tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority)`).join('\n')}

GOALS:
${goals.map(g => `- [${g.status}] ${g.title} (${g.progress}% done)`).join('\n')}
      `.trim();
    }

    const prompt = `You are an AI project manager assistant. A team member shared the following text from their work communication:

---
${text}
---

${projectContext ? `Here is the current project context:\n${projectContext}` : 'No specific project was selected.'}

Analyze the shared text and identify actionable updates for the project plan. Return a JSON response with this exact structure:

{
  "analysis": "Brief 1-2 sentence summary of what you understood from the text",
  "suggestions": [
    {
      "type": "add_task|update_task|add_goal|update_timeline|add_blocker|add_note|reassign",
      "title": "Short title for this suggestion",
      "description": "Why this change is needed based on the shared text",
      "data": {
        // For add_task: { "title": "...", "priority": "high|medium|low", "description": "..." }
        // For update_timeline: { "reason": "...", "daysToExtend": number }
        // For add_blocker: { "description": "...", "affectedTasks": [] }
        // For add_goal: { "title": "...", "description": "..." }
        // For add_note: { "content": "..." }
      }
    }
  ]
}

Rules:
- Only suggest changes that are clearly implied by the text
- Maximum 5 suggestions
- If the text has no actionable project updates, return empty suggestions array
- Be concise and specific
- Respond ONLY with valid JSON, no markdown`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    let parsed;
    try {
      parsed = JSON.parse(message.content[0].text);
    } catch {
      parsed = { analysis: 'Could not analyze the text. Please try again.', suggestions: [] };
    }

    // Save suggestion to DB
    const suggestion = await Suggestion.create({
      organization: orgId,
      project: projectId || undefined,
      createdBy: req.user._id,
      source,
      sharedText: text,
      aiAnalysis: parsed.analysis,
      items: parsed.suggestions.map(s => ({
        type: s.type,
        title: s.title,
        description: s.description,
        data: s.data,
        status: 'pending'
      }))
    });

    res.json({
      success: true,
      data: {
        id: suggestion._id,
        analysis: parsed.analysis,
        suggestions: suggestion.items,
        projectName: project?.name
      }
    });
  } catch (err) {
    console.error('Context analysis error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all pending suggestions
export const getSuggestions = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const suggestions = await Suggestion.find({
      organization: orgId,
      status: { $in: ['pending', 'partially_applied'] }
    })
      .populate('project', 'name color')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Apply a suggestion item
export const applySuggestionItem = async (req, res) => {
  try {
    const { suggestionId, itemIndex } = req.params;
    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });

    const item = suggestion.items[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Apply the action
    if (item.type === 'add_task' && suggestion.project) {
      await Task.create({
        title: item.data.title || item.title,
        description: item.data.description || item.description,
        priority: item.data.priority || 'medium',
        project: suggestion.project,
        organization: suggestion.organization,
        createdBy: req.user._id,
        status: 'todo',
        aiGenerated: true
      });
    }

    if (item.type === 'add_goal' && suggestion.project) {
      await Goal.create({
        title: item.data.title || item.title,
        description: item.data.description || item.description,
        project: suggestion.project,
        organization: suggestion.organization,
        status: 'not_started'
      });
    }

    if (item.type === 'update_timeline' && suggestion.project) {
      const project = await Project.findById(suggestion.project);
      if (project?.endDate && item.data?.daysToExtend) {
        const newEnd = new Date(project.endDate);
        newEnd.setDate(newEnd.getDate() + item.data.daysToExtend);
        await Project.findByIdAndUpdate(suggestion.project, { endDate: newEnd });
      }
    }

    // Mark item as applied
    suggestion.items[itemIndex].status = 'applied';
    const allDone = suggestion.items.every(i => i.status !== 'pending');
    if (allDone) {
      suggestion.status = suggestion.items.some(i => i.status === 'applied') ? 'applied' : 'rejected';
    } else {
      suggestion.status = 'partially_applied';
    }
    await suggestion.save();

    res.json({ success: true, message: 'Applied successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reject a suggestion item
export const rejectSuggestionItem = async (req, res) => {
  try {
    const { suggestionId, itemIndex } = req.params;
    const suggestion = await Suggestion.findById(suggestionId);
    if (!suggestion) return res.status(404).json({ success: false, message: 'Not found' });

    suggestion.items[itemIndex].status = 'rejected';
    const allDone = suggestion.items.every(i => i.status !== 'pending');
    if (allDone) suggestion.status = suggestion.items.some(i => i.status === 'applied') ? 'partially_applied' : 'rejected';
    await suggestion.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get pending suggestions count
export const getSuggestionsCount = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const count = await Suggestion.countDocuments({
      organization: orgId,
      status: { $in: ['pending', 'partially_applied'] }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 0 });
  }
};
