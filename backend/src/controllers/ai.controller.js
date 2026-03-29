import Project from '../models/Project.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import ActivityLog from '../models/ActivityLog.js';
import { analyzePlan } from '../services/ai/planAnalysis.service.js';
import { generateTasks } from '../services/ai/taskGeneration.service.js';
import { assignTeam } from '../services/ai/assignment.service.js';
import { generateTimeline } from '../services/ai/timeline.service.js';
import { generateStandup, analyzePerformance, generateReplan } from '../services/ai/standup.service.js';

export const generatePlan = async (req, res, next) => {
  try {
    const { prompt, startDate, teamUserIds } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const orgId = req.user.organization._id || req.user.organization;

    // Step 1: Analyze the plan
    const planAnalysis = await analyzePlan(prompt);

    // Step 2: Generate task structure
    const taskStructure = await generateTasks(planAnalysis);

    // Step 3: Create project
    const projectStart = startDate ? new Date(startDate) : new Date();
    const projectEnd = new Date(projectStart);
    projectEnd.setDate(projectEnd.getDate() + (planAnalysis.estimatedDurationWeeks || 8) * 7);

    const project = await Project.create({
      name: planAnalysis.projectName,
      description: planAnalysis.projectDescription,
      organization: orgId,
      industry: planAnalysis.industry,
      status: 'planning',
      priority: planAnalysis.priority || 'high',
      startDate: projectStart,
      endDate: projectEnd,
      aiGenerated: true,
      aiMetadata: { originalPrompt: prompt, generatedAt: new Date(), confidence: 0.9, detectedIndustry: planAnalysis.industry },
      createdBy: req.user._id,
      color: '#6366F1'
    });

    // Step 4: Get team members
    let teamMembers = [];
    if (teamUserIds && teamUserIds.length > 0) {
      teamMembers = await User.find({ _id: { $in: teamUserIds }, organization: orgId });
    } else {
      teamMembers = await User.find({ organization: orgId, status: 'active' }).limit(10);
    }

    // Add team to project
    if (teamMembers.length > 0) {
      const teamData = teamMembers.map((u, i) => ({ user: u._id, role: i === 0 ? 'owner' : 'member' }));
      await Project.findByIdAndUpdate(project._id, { team: teamData });
    }

    // Step 5: Apply timeline
    const timedGoals = generateTimeline(taskStructure.goals, projectStart, teamMembers);

    // Step 6: Get AI assignments
    const allTaskTitles = timedGoals.flatMap(g => g.tasks || []);
    let assignments = [];
    if (teamMembers.length > 0) {
      assignments = await assignTeam(allTaskTitles, teamMembers);
    }
    const assignmentMap = assignments.reduce((m, a) => { m[a.taskTitle] = a.assigneeEmail; return m; }, {});

    // Step 7: Create goals and tasks in DB
    const createdGoals = [];
    let taskPosition = 0;

    for (const goalData of timedGoals) {
      const goal = await Goal.create({
        title: goalData.title,
        description: goalData.description,
        project: project._id,
        order: goalData.order || 0,
        dueDate: goalData.dueDate,
        color: goalData.color,
        aiGenerated: true,
        status: 'not_started'
      });

      const createdTasks = [];
      for (const taskData of (goalData.tasks || [])) {
        const assigneeEmail = assignmentMap[taskData.title];
        const assignee = assigneeEmail ? teamMembers.find(m => m.email === assigneeEmail) : null;

        const task = await Task.create({
          title: taskData.title,
          description: taskData.description,
          project: project._id,
          goal: goal._id,
          type: taskData.type || 'other',
          priority: taskData.priority || 'medium',
          estimatedHours: taskData.estimatedHours || 8,
          startDate: taskData.startDate,
          dueDate: taskData.dueDate,
          assignees: assignee ? [assignee._id] : [],
          tools: taskData.tools || [],
          subtasks: (taskData.subtasks || []).map(s => ({ title: s.title, status: 'pending' })),
          tags: taskData.skillsRequired || [],
          position: taskPosition++,
          aiGenerated: true,
          aiMetadata: { reason: 'AI generated', estimationBasis: 'Historical data', skillsRequired: taskData.skillsRequired || [] },
          createdBy: req.user._id
        });
        createdTasks.push(task);
      }

      createdGoals.push({ ...goal.toObject(), tasks: createdTasks });
    }

    // Update project progress
    const totalTasks = createdGoals.reduce((sum, g) => sum + g.tasks.length, 0);
    await Project.findByIdAndUpdate(project._id, { 'progress.totalTasks': totalTasks });

    await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'ai_generated', entityType: 'project', entityId: project._id, entityName: project.name, metadata: { prompt, industry: planAnalysis.industry } });

    const fullProject = await Project.findById(project._id).populate('team.user', 'name avatar email');

    res.status(201).json({
      success: true,
      data: {
        project: fullProject,
        goals: createdGoals,
        planAnalysis,
        teamAssignments: assignments,
        stats: { goalsCreated: createdGoals.length, tasksCreated: totalTasks, teamAssigned: teamMembers.length }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const assignTeamToProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('team.user');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const orgId = req.user.organization._id || req.user.organization;
    const tasks = await Task.find({ project: project._id });
    const teamMembers = project.team.map(t => t.user).filter(Boolean);

    if (teamMembers.length === 0) return res.status(400).json({ success: false, message: 'No team members assigned to project' });

    const assignments = await assignTeam(tasks, teamMembers);
    const emailToUser = teamMembers.reduce((m, u) => { m[u.email] = u._id; return m; }, {});

    let updated = 0;
    for (const assignment of assignments) {
      const userId = emailToUser[assignment.assigneeEmail];
      if (userId) {
        const task = tasks.find(t => t.title === assignment.taskTitle);
        if (task) {
          await Task.findByIdAndUpdate(task._id, { assignees: [userId] });
          updated++;
        }
      }
    }

    res.json({ success: true, data: { assignments, updated } });
  } catch (err) { next(err); }
};

export const getStandup = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.find({ project: project._id }).populate('assignees', 'name email');
    const teamMembers = await User.find({ _id: { $in: project.team.map(t => t.user) } });
    const report = await generateStandup(project, tasks, teamMembers);

    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};

export const getPerformanceAnalysis = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.find({ project: project._id }).populate('assignees', 'name email jobTitle');
    const teamMembers = await User.find({ _id: { $in: project.team.map(t => t.user) } });
    const report = await analyzePerformance(project, tasks, teamMembers);

    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};

export const replanProject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.find({ project: project._id });
    const teamMembers = await User.find({ _id: { $in: project.team.map(t => t.user) } });
    const replan = await generateReplan(project, tasks, teamMembers, reason || 'Schedule adjustment needed');

    // Apply task updates
    if (replan.taskUpdates) {
      for (const update of replan.taskUpdates) {
        if (update.taskId) {
          await Task.findByIdAndUpdate(update.taskId, { dueDate: update.newDueDate, priority: update.priority });
        }
      }
    }

    // Update project end date
    if (replan.newEndDate) {
      await Project.findByIdAndUpdate(project._id, { endDate: replan.newEndDate });
    }

    const orgId = req.user.organization._id || req.user.organization;
    await ActivityLog.create({ organization: orgId, user: req.user._id, userName: req.user.name, action: 'replanned', entityType: 'project', entityId: project._id, entityName: project.name, metadata: { reason } });

    res.json({ success: true, data: replan });
  } catch (err) { next(err); }
};
