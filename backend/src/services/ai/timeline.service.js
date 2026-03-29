import { addDays, addHours, isWeekend } from '../../utils/dateUtils.js';

export function generateTimeline(goals, startDate, teamMembers) {
  const start = new Date(startDate || Date.now());
  const hoursPerDay = 8;
  const memberWorkload = {};

  for (const member of (teamMembers || [])) {
    memberWorkload[member._id?.toString() || member.email] = {
      nextAvailable: new Date(start),
      hoursPerDay: member.availability?.hoursPerDay || hoursPerDay
    };
  }

  const timedGoals = [];

  for (const goal of goals) {
    const goalDueDate = addDays(start, (goal.dueOffsetWeeks || 2) * 7);
    const timedTasks = [];

    for (const task of (goal.tasks || [])) {
      const hours = task.estimatedHours || 8;
      const assigneeId = task.assigneeId || task.assigneeEmail;

      let taskStart = new Date(start);
      if (task.dueOffsetDays) {
        taskStart = addDays(start, Math.max(0, task.dueOffsetDays - Math.ceil(hours / hoursPerDay)));
      }

      // Skip weekends
      while (isWeekend(taskStart)) taskStart = addDays(taskStart, 1);

      const workDaysNeeded = Math.ceil(hours / hoursPerDay);
      let taskEnd = new Date(taskStart);
      let daysAdded = 0;
      while (daysAdded < workDaysNeeded) {
        taskEnd = addDays(taskEnd, 1);
        if (!isWeekend(taskEnd)) daysAdded++;
      }

      timedTasks.push({
        ...task,
        startDate: taskStart,
        dueDate: task.dueOffsetDays ? addDays(start, task.dueOffsetDays) : taskEnd
      });
    }

    timedGoals.push({ ...goal, dueDate: goalDueDate, tasks: timedTasks });
  }

  return timedGoals;
}
