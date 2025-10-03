import { useMemo, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'reading', label: 'Reading', icon: '📚' },
  { value: 'savings', label: 'Savings', icon: '💰' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘‍♀️' },
  { value: 'custom', label: 'Custom', icon: '✨' },
];

const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const initialFormState = {
  id: null,
  name: '',
  category: CATEGORY_OPTIONS[0].value,
  cadence: CADENCE_OPTIONS[1].value,
  target: '',
  unit: '',
};

function getCategoryMeta(value) {
  return CATEGORY_OPTIONS.find((option) => option.value === value) ?? CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
}

function getProgressStats(goal) {
  const target = Number(goal.target ?? 0);
  const progress = Number(goal.progress ?? 0);
  if (!Number.isFinite(target) || target <= 0) {
    return { ratio: 0, percent: 0, status: 'setup' };
  }
  const ratio = Math.max(0, Math.min(1, progress / target));
  const percent = Math.round(ratio * 100);
  let status = 'on-track';
  if (percent >= 100) status = 'complete';
  else if (percent < 50) status = 'behind';
  return { ratio, percent, status };
}

export default function Goals({ goals, onUpsertGoal, onDeleteGoal, onLogProgress, onResetGoal }) {
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [logValues, setLogValues] = useState({});

  const isEditing = Boolean(formState.id);

  const sortedGoals = useMemo(() => {
    const list = [...goals];
    return list.sort((a, b) => {
      const aRatio = getProgressStats(a).ratio;
      const bRatio = getProgressStats(b).ratio;
      return aRatio - bRatio;
    });
  }, [goals]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setError('');
    setMessage('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setError('Goal name is required.');
      return;
    }
    const target = Number(formState.target);
    if (!Number.isFinite(target) || target <= 0) {
      setError('Target must be greater than zero.');
      return;
    }

    const payload = {
      id: formState.id ?? (crypto.randomUUID?.() || String(Date.now())),
      name: formState.name.trim(),
      category: formState.category,
      cadence: formState.cadence,
      target,
      unit: formState.unit.trim(),
      progress: formState.id ? Number(formState.progress ?? 0) : 0,
      streak: formState.id ? Number(formState.streak ?? 0) : 0,
      lastCompletedDate: formState.lastCompletedDate ?? null,
      lastCompletionPeriod: formState.lastCompletionPeriod ?? null,
      createdAt: formState.id ? formState.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpsertGoal(payload);
    resetForm();
    setMessage(isEditing ? 'Goal updated.' : 'Goal added to your missions.');
  };

  const handleEdit = (goal) => {
    setFormState({
      id: goal.id,
      name: goal.name,
      category: goal.category,
      cadence: goal.cadence,
      target: String(goal.target ?? ''),
      unit: goal.unit ?? '',
      progress: goal.progress ?? 0,
      streak: goal.streak ?? 0,
      lastCompletedDate: goal.lastCompletedDate ?? null,
      lastCompletionPeriod: goal.lastCompletionPeriod ?? null,
      createdAt: goal.createdAt,
    });
    setError('');
    setMessage('Editing goal');
  };

  const handleLogChange = (goalId, value) => {
    setLogValues((prev) => ({ ...prev, [goalId]: value }));
  };

  const handleLogSubmit = (goal) => {
    const raw = logValues[goal.id];
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a positive amount to log progress.');
      return;
    }
    onLogProgress(goal.id, amount);
    setLogValues((prev) => ({ ...prev, [goal.id]: '' }));
    setMessage(`Logged ${amount}${goal.unit ? ` ${goal.unit}` : ''} toward ${goal.name}.`);
  };

  const handleReset = (goal) => {
    onResetGoal(goal.id);
    setMessage(`Reset progress for ${goal.name}.`);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Personal Growth Missions</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add fitness, reading, savings, or custom goals. Logging progress fuels your household health bar.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400"
          >
            {isEditing ? 'Cancel edit' : 'Clear'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mission name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleFormChange}
              placeholder="Morning run"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              name="category"
              value={formState.category}
              onChange={handleFormChange}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cadence</label>
            <select
              name="cadence"
              value={formState.cadence}
              onChange={handleFormChange}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {CADENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target amount</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                name="target"
                value={formState.target}
                onChange={handleFormChange}
                placeholder="5"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                name="unit"
                value={formState.unit}
                onChange={handleFormChange}
                placeholder="km / chapters / pesos"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="ml-auto inline-flex items-center justify-center rounded-lg bg-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40"
            >
              {isEditing ? 'Update goal' : 'Add goal'}
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-brand-light">{message}</p>}
      </div>

      <div className="space-y-4">
        {sortedGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No personal goals yet. Add a mission to start earning streaks.
          </div>
        ) : (
          sortedGoals.map((goal) => {
            const meta = getCategoryMeta(goal.category);
            const stats = getProgressStats(goal);
            const percentText = `${stats.percent}%`;

            return (
              <div
                key={goal.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center md:justify-between ${
                  stats.status === 'behind'
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-500 dark:bg-amber-500/10'
                    : stats.status === 'complete'
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {meta.icon} {goal.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {goal.cadence.charAt(0).toUpperCase() + goal.cadence.slice(1)} · target {goal.target}
                    {goal.unit ? ` ${goal.unit}` : ''}
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-brand-light"
                      style={{ width: percentText }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Progress: {Math.min(goal.progress ?? 0, goal.target)}
                    {goal.unit ? ` ${goal.unit}` : ''} / {goal.target}
                    {goal.unit ? ` ${goal.unit}` : ''} · Streak {goal.streak ?? 0} {goal.streak === 1 ? 'period' : 'periods'}
                  </p>
                  {goal.lastCompletedDate && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-300">
                      Last cleared {new Date(goal.lastCompletedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={logValues[goal.id] ?? ''}
                      onChange={(event) => handleLogChange(goal.id, event.target.value)}
                      placeholder={`Add ${goal.unit || 'amount'}`}
                      className="w-32 rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-900 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleLogSubmit(goal)}
                      className="inline-flex items-center rounded-lg bg-brand-light px-3 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40"
                    >
                      Log
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(goal)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReset(goal)}
                      className="rounded-lg border border-blue-200 px-3 py-1 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-blue-500/40 dark:text-blue-200"
                    >
                      Reset period
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
