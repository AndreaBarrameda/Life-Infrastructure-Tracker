import { calculateDaysLeft } from '../utils/calculations';
import { getLowInventoryItems, getUpcomingBills } from '../utils/reminders';

const LOCATION_SECTIONS = {
  pantry: { title: 'Pantry Staples', icon: '🥫' },
  fridge: { title: 'Fridge Essentials', icon: '🧊' },
  freezer: { title: 'Freezer Reserve', icon: '❄️' },
  other: { title: 'Other Storage', icon: '📦' },
};

function HealthBar({ health }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Household Health</h3>
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{health.score}%</span>
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Green means stocked and on-time. Red signals overdue bills or low essentials.
      </p>
      <div className="mt-4 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800">
        <div
          className={`${health.colorClass} h-full rounded-full transition-all`}
          style={{ width: `${health.score}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Status: {health.status === 'secure' ? '🟢 Secure' : health.status === 'watch' ? '🟡 Watch out' : '🔴 Take action today'}
      </p>
    </div>
  );
}

function LevelCard({ gamification, levelProgress }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Progress & Points</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep chores flowing to climb household ranks.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center rounded-full bg-brand-light/10 px-3 py-1 font-semibold text-brand-light">
          ⭐ {gamification.points} points
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
          🏅 {gamification.level}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{levelProgress.label}</span>
          <span>{levelProgress.nextLabel}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-brand-light"
            style={{ width: `${levelProgress.progress}%` }}
          />
        </div>
        {levelProgress.nextThreshold && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {levelProgress.nextThreshold - gamification.points} points until {levelProgress.nextLabel}.
          </p>
        )}
      </div>
    </div>
  );
}

function StreakCard({ streakMessage, history }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Streak</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{streakMessage}</p>
      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Complete actions today to earn rewards.
          </p>
        ) : (
          history.slice(0, 4).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/40"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{entry.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
              <span className="text-xs font-semibold text-brand-light">+{entry.points}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Badges({ badges }) {
  const badgeDetails = {
    'Utility Master': { icon: '💡', description: 'Paid 3 bills on time in a row.' },
    'Preparedness Pro': { icon: '🛡️', description: 'Kept every essential above a 2-day buffer.' },
    'Resilient Household': { icon: '🏠', description: 'Tracked 10 essentials consistently.' },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Badges</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hit milestones to unlock new titles.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {badges.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No badges yet—keep the household running smoothly to earn your first one.
          </p>
        ) : (
          badges.map((badge) => {
            const detail = badgeDetails[badge] ?? { icon: '✨', description: '' };
            return (
              <div key={badge} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{detail.icon} {badge}</p>
                {detail.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{detail.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LocationSummary({ inventory }) {
  const groups = inventory.reduce((acc, item) => {
    const bucket = item.location ?? 'other';
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(item);
    return acc;
  }, {});

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Object.entries(LOCATION_SECTIONS).map(([key, meta]) => {
        const items = groups[key] ?? [];
        return (
          <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                {meta.icon} {meta.title}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} item{items.length === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nothing tracked here yet.
                </p>
              ) : (
                items.slice(0, 4).map((item) => {
                  const daysLeft = calculateDaysLeft(item.quantity, item.dailyUsage);
                  const isLow = Number.isFinite(daysLeft) && daysLeft < 3;
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{isLow ? '⚠️' : '✅'} {item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.quantity} {item.unit} · uses {item.dailyUsage}
                          {item.unit ? ` ${item.unit}` : ''}/day
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        {Number.isFinite(daysLeft) ? `${daysLeft}d left` : '—'}
                      </span>
                    </div>
                  );
                })
              )}
              {items.length > 4 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">+{items.length - 4} more tracked here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamSummary({ members }) {
  if (!members.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        Invite family or housemates to collaborate on streaks and challenges.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Household Squad</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compare streaks, share quests, and keep the household score high together.</p>
      <div className="mt-4 space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800/40">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{member.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{member.email || member.role}</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-300">Streak: {member.streak ?? 0} days</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({
  inventory,
  bills,
  lowItems,
  upcomingBills,
  gamification,
  health,
  levelProgress,
  streakMessage,
  members,
}) {
  const lowCount = lowItems?.length ?? getLowInventoryItems(inventory).length;
  const upcomingCount = upcomingBills?.length ?? getUpcomingBills(bills).length;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-brand-light to-brand-dark p-8 text-white shadow-lg">
        <h2 className="text-3xl font-semibold">Life Infrastructure Snapshot</h2>
        <p className="mt-2 max-w-2xl text-white/80">
          Today&apos;s mission: keep your household health high, earn points, and maintain the streak. Complete quests like paying bills on time or restocking essentials.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/15 p-4 backdrop-blur">
            <p className="text-sm uppercase tracking-wide text-white/70">⚠️ Low supplies</p>
            <p className="mt-2 text-3xl font-semibold">{lowCount}</p>
            <p className="mt-1 text-sm text-white/70">Items below 3 days remaining</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/15 p-4 backdrop-blur">
            <p className="text-sm uppercase tracking-wide text-white/70">🔥 Upcoming bills</p>
            <p className="mt-2 text-3xl font-semibold">{upcomingCount}</p>
            <p className="mt-1 text-sm text-white/70">Due within one week</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/15 p-4 backdrop-blur">
            <p className="text-sm uppercase tracking-wide text-white/70">⭐ Points</p>
            <p className="mt-2 text-3xl font-semibold">{gamification.points}</p>
            <p className="mt-1 text-sm text-white/70">Keep climbing toward new levels</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/15 p-4 backdrop-blur">
            <p className="text-sm uppercase tracking-wide text-white/70">🔥 Streak</p>
            <p className="mt-2 text-3xl font-semibold">{gamification.streak?.current ?? 0}</p>
            <p className="mt-1 text-sm text-white/70">Best: {gamification.streak?.best ?? 0} days</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HealthBar health={health} />
        <LevelCard gamification={gamification} levelProgress={levelProgress} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StreakCard streakMessage={streakMessage} history={gamification.history ?? []} />
        <Badges badges={gamification.badges ?? []} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">What&apos;s inside your home</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Organized by pantry, fridge, freezer, and more.</p>
            <div className="mt-4">
              <LocationSummary inventory={inventory} />
            </div>
          </div>
          <div className="w-full lg:w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Community & Challenges</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join seasonal quests like the “Preparedness Challenge” and keep your collective score high.
            </p>
            <div className="mt-4 space-y-4">
              <TeamSummary members={members} />
              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <p className="font-semibold">🎯 Today&apos;s quest</p>
                <p className="mt-1">Keep household health above 90% and log one restock to earn bonus points.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
