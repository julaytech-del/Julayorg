import FormView from '../models/FormView.js';
import Task from '../models/Task.js';

export const getForms = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const forms = await FormView.find({ organization: orgId }).populate('project', 'name').select('-submissions');
    res.json({ success: true, data: forms });
  } catch (err) { next(err); }
};

export const createForm = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const form = await FormView.create({ ...req.body, organization: orgId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: form });
  } catch (err) { next(err); }
};

export const updateForm = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const form = await FormView.findOneAndUpdate({ _id: req.params.id, organization: orgId }, req.body, { new: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (err) { next(err); }
};

export const deleteForm = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    await FormView.findOneAndDelete({ _id: req.params.id, organization: orgId });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getPublicForm = async (req, res, next) => {
  try {
    const form = await FormView.findOne({ publicToken: req.params.token, active: true }).populate('project', 'name color').select('-submissions -createdBy');
    if (!form) return res.status(404).json({ success: false, message: 'Form not found or inactive' });
    res.json({ success: true, data: form });
  } catch (err) { next(err); }
};

export const submitForm = async (req, res, next) => {
  try {
    const form = await FormView.findOne({ publicToken: req.params.token, active: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const { data } = req.body;
    // Map form fields to task fields
    const taskData = { project: form.project, organization: form.organization, status: 'planned', priority: 'medium' };
    form.fields.forEach(field => {
      const value = data[field.id];
      if (value === undefined || value === null || value === '') return;
      if (field.mapTo === 'title') taskData.title = String(value);
      else if (field.mapTo === 'description') taskData.description = String(value);
      else if (field.mapTo === 'priority') taskData.priority = value;
      else if (field.mapTo === 'dueDate') taskData.dueDate = new Date(value);
      else if (field.mapTo === 'estimatedHours') taskData.estimatedHours = Number(value);
    });
    if (!taskData.title) taskData.title = 'Form Submission ' + new Date().toLocaleString();

    const task = await Task.create(taskData);
    form.submissions.push({ data, createdTaskId: task._id });
    await form.save();
    res.status(201).json({ success: true, data: { taskId: task._id, message: 'Submission received and task created!' } });
  } catch (err) { next(err); }
};
