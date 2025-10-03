const INVENTORY_KEY = 'life-infrastructure-inventory';
const BILLS_KEY = 'life-infrastructure-bills';
const PREFS_KEY = 'life-infrastructure-preferences';
const REMINDER_KEY = 'life-infrastructure-last-reminder';
const GAMIFICATION_KEY = 'life-infrastructure-gamification';
const MEMBERS_KEY = 'life-infrastructure-members';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readJson(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage`, error);
  }
}

export function loadInventory() {
  return readJson(INVENTORY_KEY, []);
}

export function saveInventory(items) {
  writeJson(INVENTORY_KEY, items);
}

export function loadBills() {
  return readJson(BILLS_KEY, []);
}

export function saveBills(bills) {
  writeJson(BILLS_KEY, bills);
}

export function loadPreferences() {
  return readJson(PREFS_KEY, { darkMode: false });
}

export function savePreferences(preferences) {
  writeJson(PREFS_KEY, preferences);
}

export function getLastReminderDate() {
  const saved = readJson(REMINDER_KEY, null);
  return saved ? new Date(saved) : null;
}

export function setLastReminderDate(date) {
  if (!isBrowser) return;
  writeJson(REMINDER_KEY, date.toISOString());
}

export function loadGamification() {
  return readJson(GAMIFICATION_KEY, null);
}

export function saveGamification(state) {
  writeJson(GAMIFICATION_KEY, state);
}

export function loadMembers() {
  return readJson(MEMBERS_KEY, []);
}

export function saveMembers(members) {
  writeJson(MEMBERS_KEY, members);
}
