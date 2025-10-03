import { calculateDaysLeft, daysUntil } from './calculations';
import { getLastReminderDate, setLastReminderDate } from './storage';

const LOW_ITEM_THRESHOLD_DAYS = 3;
const UPCOMING_BILL_THRESHOLD_DAYS = 7;

function hasNotificationSupport() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getLowInventoryItems(items) {
  return items.filter((item) => calculateDaysLeft(item.quantity, item.dailyUsage) < LOW_ITEM_THRESHOLD_DAYS);
}

export function getUpcomingBills(bills) {
  return bills.filter((bill) => {
    const days = daysUntil(bill.dueDate);
    return Number.isFinite(days) && days >= 0 && days <= UPCOMING_BILL_THRESHOLD_DAYS;
  });
}

function createReminderMessage(lowItems, upcomingBills) {
  const parts = [];
  if (lowItems.length) {
    const names = lowItems
      .map((item) => {
        const location = item.location ? ` (${item.location})` : '';
        return `${item.name}${location}`;
      })
      .join(', ');
    parts.push(`⚠️ Low supplies: ${names}`);
  }
  if (upcomingBills.length) {
    const names = upcomingBills.map((bill) => bill.name).join(', ');
    parts.push(`💸 Upcoming bills: ${names}`);
  }
  return parts.join(' | ');
}

export function checkAndNotifyReminders(items, bills, { skipPermissionRequest = false } = {}) {
  if (!hasNotificationSupport()) return;

  if (Notification.permission === 'default' && !skipPermissionRequest) {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          checkAndNotifyReminders(items, bills, { skipPermissionRequest: true });
        }
      })
      .catch(() => {});
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const lastReminder = getLastReminderDate();
  const today = new Date();
  if (lastReminder && lastReminder.toDateString() === today.toDateString()) {
    return;
  }

  const lowItems = getLowInventoryItems(items);
  const upcomingBills = getUpcomingBills(bills);

  if (!lowItems.length && !upcomingBills.length) {
    return;
  }

  const body = createReminderMessage(lowItems, upcomingBills);
  try {
    new Notification('Life Infrastructure Tracker', { body });
    setLastReminderDate(today);
  } catch (error) {
    console.error('Failed to dispatch reminder notification', error);
  }
}

export function scheduleDailyReminderCheck(items, bills) {
  if (typeof window === 'undefined') return undefined;

  checkAndNotifyReminders(items, bills);

  const intervalId = window.setInterval(() => {
    checkAndNotifyReminders(items, bills);
  }, 24 * 60 * 60 * 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}
