import { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Inventory from './components/Inventory.jsx';
import Bills from './components/Bills.jsx';
import Assistant from './components/Assistant.jsx';
import Household from './components/Household.jsx';
import {
  loadBills,
  loadInventory,
  loadPreferences,
  loadGamification,
  loadMembers,
  saveBills,
  saveInventory,
  savePreferences,
  saveGamification,
  saveMembers,
} from './utils/storage.js';
import {
  checkAndNotifyReminders,
  getLowInventoryItems,
  getUpcomingBills,
  scheduleDailyReminderCheck,
} from './utils/reminders.js';
import { daysUntil } from './utils/calculations.js';
import {
  calculateHouseholdHealth,
  evaluateBadges,
  getLevelProgress,
  getStreakMessage,
  initialGamificationState,
  registerBillPaid,
  registerInventoryEvent,
  registerReminderResponse,
  updateStreak,
} from './utils/gamification.js';
import './index.css';

const VIEWS = {
  HOME: 'home',
  INVENTORY: 'inventory',
  BILLS: 'bills',
  HOUSEHOLD: 'household',
  ASSISTANT: 'assistant',
};

const NAVIGATION = [
  { id: VIEWS.HOME, label: 'Home' },
  { id: VIEWS.INVENTORY, label: 'Inventory' },
  { id: VIEWS.BILLS, label: 'Bills' },
  { id: VIEWS.HOUSEHOLD, label: 'Household' },
  { id: VIEWS.ASSISTANT, label: 'Assistant' },
];

function normalizeInventory(items) {
  return items.map((item) => ({
    ...item,
    location: item.location ?? 'pantry',
  }));
}

export default function App() {
  const [inventory, setInventory] = useState(() => normalizeInventory(loadInventory()));
  const [bills, setBills] = useState(() => loadBills());
  const [members, setMembers] = useState(() => loadMembers());
  const [activeView, setActiveView] = useState(VIEWS.HOME);
  const [isDarkMode, setIsDarkMode] = useState(() => loadPreferences().darkMode);
  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [gamification, setGamification] = useState(() => ({
    ...initialGamificationState,
    ...(loadGamification() ?? {}),
  }));

  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    saveBills(bills);
  }, [bills]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveGamification(gamification);
  }, [gamification]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    savePreferences({ darkMode: isDarkMode });
  }, [isDarkMode]);

  useEffect(() => {
    const cleanup = scheduleDailyReminderCheck(inventory, bills);
    return cleanup;
  }, [inventory, bills]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return undefined;
    const handleVisibility = () => {
      setNotificationStatus(Notification.permission);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const lowInventoryItems = useMemo(() => getLowInventoryItems(inventory), [inventory]);
  const upcomingBills = useMemo(() => getUpcomingBills(bills), [bills]);
  const health = useMemo(() => calculateHouseholdHealth(inventory, bills), [inventory, bills]);

  useEffect(() => {
    const overdueBills = bills.filter((bill) => daysUntil(bill.dueDate) < 0).length;
    const hasIssues = lowInventoryItems.length > 0 || overdueBills > 0;
    setGamification((prev) => updateStreak(evaluateBadges(prev, inventory, bills), { hasIssues }));
  }, [inventory, bills, lowInventoryItems.length]);

  const handleUpsertItem = (item) => {
    setInventory((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      const nextInventory = exists
        ? prev.map((existing) => (existing.id === item.id ? { ...existing, ...item } : existing))
        : [...prev, item];

      setGamification((prevState) => {
        let updated = registerInventoryEvent(prevState, { isNewItem: !exists, itemName: item.name });
        updated = evaluateBadges(updated, nextInventory, bills);
        return updated;
      });

      return nextInventory;
    });
  };

  const handleDeleteItem = (id) => {
    setInventory((prev) => {
      const nextInventory = prev.filter((item) => item.id !== id);
      setGamification((prevState) => evaluateBadges(prevState, nextInventory, bills));
      return nextInventory;
    });
  };

  const handleUpsertBill = (bill) => {
    setBills((prev) => {
      const exists = prev.some((existing) => existing.id === bill.id);
      const nextBills = exists
        ? prev.map((existing) => (existing.id === bill.id ? { ...existing, ...bill } : existing))
        : [...prev, bill];
      setGamification((prevState) => evaluateBadges(prevState, inventory, nextBills));
      return nextBills;
    });
  };

  const handleDeleteBill = (id) => {
    setBills((prev) => {
      const nextBills = prev.filter((bill) => bill.id !== id);
      setGamification((prevState) => evaluateBadges(prevState, inventory, nextBills));
      return nextBills;
    });
  };

  const handleMarkBillPaid = (id) => {
    setBills((prev) => {
      const nextBills = prev.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              lastPaidDate: new Date().toISOString(),
            }
          : bill,
      );

      const paidBill = nextBills.find((bill) => bill.id === id);
      const onTime = paidBill?.dueDate ? daysUntil(paidBill.dueDate) >= 0 : false;

      setGamification((prevState) => {
        let updated = registerBillPaid(prevState, { billName: paidBill?.name ?? 'Bill', onTime });
        updated = evaluateBadges(updated, inventory, nextBills);
        return updated;
      });

      return nextBills;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const requestNotificationPermission = () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setNotificationStatus('unsupported');
      return;
    }

    Notification.requestPermission()
      .then((permission) => {
        setNotificationStatus(permission);
        if (permission === 'granted') {
          checkAndNotifyReminders(inventory, bills, { skipPermissionRequest: true });
          setGamification((prevState) => registerReminderResponse(prevState));
        }
      })
      .catch(() => {
        setNotificationStatus('denied');
      });
  };

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation not supported in this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude, timestamp: position.timestamp });
        setLocationError('');
        setIsLocating(false);
      },
      (error) => {
        setLocationError(error.message || 'Location permission denied.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleAddMember = (member) => {
    setMembers((prev) => {
      const nextMembers = [...prev, member];
      return nextMembers;
    });
  };

  const handleRemoveMember = (id) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleReminderAcknowledged = () => {
    setGamification((prevState) => registerReminderResponse(prevState));
  };

  const levelProgress = useMemo(() => getLevelProgress(gamification.points), [gamification.points]);
  const streakMessage = useMemo(() => getStreakMessage(gamification), [gamification]);

  const locationDisplay = userLocation
    ? `📍 ${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}`
    : locationError
      ? `⚠️ ${locationError}`
      : '📍 Location not shared';

  const notificationLabel = (() => {
    if (notificationStatus === 'granted') return 'Notifications on';
    if (notificationStatus === 'denied') return 'Notifications blocked';
    if (notificationStatus === 'default') return 'Enable reminders';
    return 'Notifications unsupported';
  })();

  const renderActiveView = () => {
    switch (activeView) {
      case VIEWS.INVENTORY:
        return (
          <Inventory
            items={inventory}
            onUpsertItem={handleUpsertItem}
            onDeleteItem={handleDeleteItem}
          />
        );
      case VIEWS.BILLS:
        return (
          <Bills
            bills={bills}
            onUpsertBill={handleUpsertBill}
            onDeleteBill={handleDeleteBill}
            onMarkBillPaid={handleMarkBillPaid}
          />
        );
      case VIEWS.HOUSEHOLD:
        return (
          <Household
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            points={gamification.points}
            streak={gamification.streak?.current ?? 0}
          />
        );
      case VIEWS.ASSISTANT:
        return (
          <Assistant
            inventory={inventory}
            bills={bills}
            points={gamification.points}
            streak={gamification.streak?.current ?? 0}
            level={gamification.level}
            onReminderAcknowledged={handleReminderAcknowledged}
          />
        );
      case VIEWS.HOME:
      default:
        return (
          <Dashboard
            inventory={inventory}
            bills={bills}
            lowItems={lowInventoryItems}
            upcomingBills={upcomingBills}
            gamification={gamification}
            health={health}
            levelProgress={levelProgress}
            streakMessage={streakMessage}
            members={members}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16 pt-10 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-light to-brand-dark" />
              <div>
                <h1 className="text-xl font-semibold">Life Infrastructure Tracker</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gamify your household logistics with points, streaks, and AI quests.</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{locationDisplay}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300"
            >
              {isLocating ? '📍 Locating…' : userLocation ? '📍 Update location' : '📍 Share location'}
            </button>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300"
            >
              🔔 {notificationLabel}
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-gray-800">
                {isDarkMode ? '🌙' : '☀️'}
              </span>
              <span className="ml-2">{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 text-sm">
          {NAVIGATION.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`rounded-full px-4 py-2 font-medium transition ${
                  isActive
                    ? 'bg-brand-light text-white shadow-sm shadow-brand-light/40'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {renderActiveView()}
        </main>

        <footer className="mt-8 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>⚠️ Low supplies: {lowInventoryItems.length} · 💸 Bills due soon: {upcomingBills.length} · ⭐ Points: {gamification.points}</p>
            <p className="text-xs">{streakMessage}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
