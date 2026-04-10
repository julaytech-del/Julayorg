import ActivityLog from '../models/ActivityLog.js';

export const getActivityLog = async (req, res) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const { entityType, entityId, userId, limit = 50, page = 1 } = req.query;

    const filter = { organization: orgId };
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (userId) filter.user = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ActivityLog.countDocuments(filter);

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name avatar')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logActivity = async (orgId, userId, userName, action, entityType, entityId, entityName, changes, metadata) => {
  try {
    await ActivityLog.create({
      organization: orgId,
      user: userId,
      userName,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      metadata
    });
  } catch (_err) {
    // silent fail — activity logging should never break main flow
  }
};
