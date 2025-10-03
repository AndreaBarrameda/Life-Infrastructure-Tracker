import { getLowInventoryItems, getUpcomingBills } from './reminders';
import { daysUntil } from './calculations';

export const POINT_REWARDS = {
  inventoryAdd: 10,
  inventoryRestock: 6,
  billPaidOnTime: 15,
  reminderResponse: 8,
};

const LEVELS = [
  { name: 'Bronze Caretaker', min: 0 },
  { name: 'Silver Steward', min: 200 },
  { name: 'Gold Guardian', min: 500 },
  { name: 'Platinum Protector', min: 900 },
];

export const initialGamificationState = {
  points: 0,
  streak: {
    current: 0,
    best: 0,
    lastEvaluatedDate: null,
  },
  badges: [],
  level: LEVELS[0].name,
  history: [],
  counters: {
    billsPaidOnTime: 0,
    essentialsTracked: 0,
    consecutivePreparedDays: 0,
  },
  lastReminderAcknowledged: null,
};

export function getLevelForPoints(points) {
  const tier = [...LEVELS].reverse().find((level) => points >= level.min);
  return tier ? tier.name : LEVELS[0].name;
}

export function calculateHouseholdHealth(inventory, bills) {
  const lowItems = getLowInventoryItems(inventory).length;
  const overdueBills = bills.filter((bill) => daysUntil(bill.dueDate) < 0).length;

  let score = 100;
  score -= lowItems * 12;
  score -= overdueBills * 18;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'secure';
  if (score < 35) {
    status = 'danger';
  } else if (score < 70) {
    status = 'watch';
  }

  return {
    score,
    status,
    colorClass:
      status === 'secure'
        ? 'bg-green-500'
        : status === 'watch'
          ? 'bg-amber-400'
          : 'bg-red-500',
  };
}

export function appendHistory(state, entry) {
  const historyEntry = {
    id: crypto.randomUUID?.() || String(Date.now()),
    ...entry,
  };
  const history = [historyEntry, ...state.history].slice(0, 25);
  return { ...state, history };
}

export function awardPoints(state, { type, amount, message, metadata }) {
  const delta = amount ?? POINT_REWARDS[type] ?? 0;
  if (!delta) return state;
  const nextPoints = state.points + delta;
  const historyState = appendHistory(state, {
    type,
    points: delta,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  });

  return {
    ...historyState,
    points: nextPoints,
    level: getLevelForPoints(nextPoints),
  };
}

export function registerInventoryEvent(state, { isNewItem, itemName }) {
  const rewardType = isNewItem ? 'inventoryAdd' : 'inventoryRestock';
  const message = isNewItem
    ? `✨ Earned ${POINT_REWARDS.inventoryAdd} points for logging ${itemName}.`
    : `🔄 Earned ${POINT_REWARDS.inventoryRestock} points for restocking ${itemName}.`;

  const updated = awardPoints(state, {
    type: rewardType,
    message,
    metadata: { itemName },
  });

  if (isNewItem) {
    const essentialsTracked = (updated.counters?.essentialsTracked ?? 0) + 1;
    return {
      ...updated,
      counters: {
        ...updated.counters,
        essentialsTracked,
      },
    };
  }

  return updated;
}

export function registerBillPaid(state, { billName, onTime }) {
  let updated = state;
  if (onTime) {
    updated = awardPoints(state, {
      type: 'billPaidOnTime',
      message: `💡 Earned ${POINT_REWARDS.billPaidOnTime} points for paying ${billName} on time.`,
      metadata: { billName },
    });
    const billsPaidOnTime = (updated.counters?.billsPaidOnTime ?? 0) + 1;
    updated = {
      ...updated,
      counters: {
        ...updated.counters,
        billsPaidOnTime,
      },
    };
  }
  return updated;
}

export function registerReminderResponse(state) {
  const updated = awardPoints(state, {
    type: 'reminderResponse',
    message: `🎯 Earned ${POINT_REWARDS.reminderResponse} points for acting on a reminder.`,
  });
  return {
    ...updated,
    lastReminderAcknowledged: new Date().toISOString(),
  };
}

export function evaluateBadges(state, inventory, bills) {
  const badges = new Set(state.badges ?? []);

  if ((state.counters?.billsPaidOnTime ?? 0) >= 3) {
    badges.add('Utility Master');
  }

  const allHealthy = getLowInventoryItems(inventory).every((item) => {
    const days = item.dailyUsage > 0 ? item.quantity / item.dailyUsage : Infinity;
    return days >= 2;
  });
  if (allHealthy && inventory.length > 0) {
    badges.add('Preparedness Pro');
  }

  if ((state.counters?.essentialsTracked ?? 0) >= 10) {
    badges.add('Resilient Household');
  }

  return { ...state, badges: [...badges] };
}

export function updateStreak(state, { hasIssues }) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const lastEvaluated = state.streak.lastEvaluatedDate;

  if (lastEvaluated === todayKey) {
    return state;
  }

  let current = hasIssues ? 0 : state.streak.current + 1;
  if (hasIssues) {
    current = 0;
  }

  const best = Math.max(state.streak.best, current);
  const counters = {
    ...state.counters,
    consecutivePreparedDays: hasIssues ? 0 : (state.counters?.consecutivePreparedDays ?? 0) + 1,
  };

  return {
    ...state,
    streak: {
      current,
      best,
      lastEvaluatedDate: todayKey,
    },
    counters,
  };
}

export function getStreakMessage(state) {
  if (!state.streak?.current) return '✅ Let\'s start a new streak today!';
  return `🔥 ${state.streak.current}-day streak: No overdue bills or critical shortages!`;
}

export function getLevelProgress(points) {
  const currentLevel = LEVELS.find((level, index) => {
    const next = LEVELS[index + 1];
    return !next || (points >= level.min && points < next.min);
  }) || LEVELS[LEVELS.length - 1];

  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  if (!nextLevel) {
    return {
      label: currentLevel.name,
      progress: 100,
      nextLabel: 'Max level',
      nextThreshold: null,
    };
  }

  const range = nextLevel.min - currentLevel.min;
  const progress = Math.min(100, Math.round(((points - currentLevel.min) / range) * 100));
  return {
    label: currentLevel.name,
    progress,
    nextLabel: nextLevel.name,
    nextThreshold: nextLevel.min,
  };
}
