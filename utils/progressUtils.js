/**
 * Utility functions to build action plans and recalculate progress.
 * - buildActionPlan(type, monthsCount, tasksTemplate): constructs months/weeks/days/tasks with weights
 * - recalcKeyResultProgress(kr): sums completed task weights / total weights
 * - recalcObjectiveProgress(objective): weighted avg of KRs
 */

function buildActionPlan({ type, monthsCount = 0, tasksTemplate = {} }) {
  // tasksTemplate is optional — a map of dayName -> [ { title, time, notes } ]
  // If not provided we create one placeholder task per day.
  const plan = {
    type,
    monthsCount,
    months: [],
    weeks: []
  };

  // helper: create tasks for a day
  function createTasksForDay(dayWeight, dayName) {
    const templates = (tasksTemplate && tasksTemplate[dayName]) || [{ title: 'Placeholder task', time: '' }];
    const taskCount = templates.length;
    return templates.map(t => ({
      title: t.title || 'Task',
      notes: t.notes || '',
      time: t.time || '',
      completed: false,
      weight: dayWeight / taskCount
    }));
  }

  const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  if (type === '1_week') {
    // create single week with 7 days
    const weekWeight = 1.0;
    const dayWeight = weekWeight / 7;
    const days = WEEK_DAYS.map(name => ({
      name,
      date: '',
      weight: dayWeight,
      tasks: createTasksForDay(dayWeight, name)
    }));
    plan.weeks.push({ name: 'Week 1', weight: weekWeight, days });
    return plan;
  }

  // for month-based plans (6_month, 3_month, 1_month)
  const months = [];
  const monthsCountFinal = monthsCount || (type === '1_month' ? 1 : 1);

  for (let m = 0; m < monthsCountFinal; m++) {
    const monthWeight = 1.0 / monthsCountFinal; // each month equal share of KR
    const weeks = [];
    // we'll use 4 weeks per month for the UI
    const weeksPerMonth = 4;
    for (let w = 0; w < weeksPerMonth; w++) {
      const weekWeight = monthWeight / weeksPerMonth;
      const days = WEEK_DAYS.map(name => {
        const dayWeight = weekWeight / 7;
        return {
          name,
          date: '',
          weight: dayWeight,
          tasks: createTasksForDay(dayWeight, name)
        };
      });
      weeks.push({ name: `Week ${w + 1}`, weight: weekWeight, days });
    }
    months.push({ name: `Month ${m + 1}`, weight: monthWeight, weeks });
  }

  plan.months = months;
  return plan;
}

function recalcKeyResultProgress(kr) {
  // sum weights of all tasks and completed tasks
  let total = 0;
  let completed = 0;

  // helper for weeks array (either in actionPlan.weeks for 1_week or months[].weeks)
  const processWeek = (week) => {
    if (!week || !week.days) return;
    for (const day of week.days) {
      if (!day.tasks) continue;
      for (const task of day.tasks) {
        total += (task.weight || 0);
        if (task.completed) completed += (task.weight || 0);
      }
    }
  };

  for (const ap of kr.actionPlans || []) {
    if (ap.type === '1_week') {
      for (const week of ap.weeks || []) processWeek(week);
    } else {
      for (const month of ap.months || []) {
        for (const week of month.weeks || []) processWeek(week);
      }
    }
  }

  const progress = total === 0 ? 0 : Math.round((completed / total) * 10000) / 100; // round 2 decimals
  kr.progress = progress;
  return kr.progress;
}

function recalcObjectiveProgress(objective) {
  // weighted average of keyResults by kr.weight
  let totalWeight = 0;
  let weightedSum = 0;
  for (const kr of objective.keyResults || []) {
    totalWeight += (kr.weight || 1);
    weightedSum += (kr.progress || 0) * (kr.weight || 1);
  }
  const progress = totalWeight === 0 ? 0 : Math.round((weightedSum / totalWeight) * 100) / 100;
  objective.progress = progress;
  return objective.progress;
}

module.exports = {
  buildActionPlan,
  recalcKeyResultProgress,
  recalcObjectiveProgress
};
