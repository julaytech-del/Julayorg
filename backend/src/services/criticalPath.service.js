/**
 * Critical Path Method (CPM) implementation
 * @param {Array} tasks - array of task objects with _id, startDate, dueDate, dependencies
 * @returns {{ criticalTaskIds: string[], taskFloat: Object }}
 */
export function computeCriticalPath(tasks) {
  if (!tasks || tasks.length === 0) return { criticalTaskIds: [], taskFloat: {} };

  const taskMap = {};
  tasks.forEach(t => {
    const id = t._id.toString();
    const start = t.startDate ? new Date(t.startDate) : new Date();
    const end = t.dueDate ? new Date(t.dueDate) : new Date(Date.now() + 86400000 * 7);
    const duration = Math.max(1, Math.ceil((end - start) / 86400000));
    taskMap[id] = { id, duration, deps: (t.dependencies || []).map(d => d.toString()), early_start: 0, early_finish: 0, late_start: 0, late_finish: 0, float: 0 };
  });

  // Forward pass
  const visited = new Set();
  function forwardPass(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const task = taskMap[id];
    if (!task) return;
    task.deps.forEach(depId => forwardPass(depId));
    task.early_start = task.deps.length === 0 ? 0 : Math.max(...task.deps.map(d => taskMap[d]?.early_finish || 0));
    task.early_finish = task.early_start + task.duration;
  }
  Object.keys(taskMap).forEach(id => forwardPass(id));

  // Project end
  const projectEnd = Math.max(...Object.values(taskMap).map(t => t.early_finish));

  // Backward pass
  const bvisited = new Set();
  function backwardPass(id) {
    if (bvisited.has(id)) return;
    bvisited.add(id);
    const task = taskMap[id];
    if (!task) return;
    const successors = Object.values(taskMap).filter(t => t.deps.includes(id));
    if (successors.length === 0) {
      task.late_finish = projectEnd;
    } else {
      successors.forEach(s => backwardPass(s.id));
      task.late_finish = Math.min(...successors.map(s => s.late_start));
    }
    task.late_start = task.late_finish - task.duration;
    task.float = task.late_start - task.early_start;
  }
  Object.keys(taskMap).forEach(id => backwardPass(id));

  const criticalTaskIds = Object.values(taskMap).filter(t => t.float === 0).map(t => t.id);
  const taskFloat = {};
  Object.values(taskMap).forEach(t => { taskFloat[t.id] = t.float; });

  return { criticalTaskIds, taskFloat };
}
