import Department from '../models/Department.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

export const getDepartments = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const departments = await Department.find({ organization: orgId }).populate('head', 'name avatar');

    const deptIds = departments.map(d => d._id);
    const memberCounts = await User.aggregate([
      { $match: { department: { $in: deptIds }, organization: orgId } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const countMap = memberCounts.reduce((m, c) => { m[c._id.toString()] = c.count; return m; }, {});

    const result = departments.map(d => ({ ...d.toObject(), memberCount: countMap[d._id.toString()] || 0 }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const createDepartment = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const dept = await Department.create({ ...req.body, organization: orgId });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('head', 'name avatar');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    await User.updateMany({ department: dept._id }, { $unset: { department: 1 } });
    await dept.deleteOne();
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) { next(err); }
};
