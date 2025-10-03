import { useMemo, useState } from 'react';
import { calculateDaysLeft } from '../utils/calculations';

const LOCATION_OPTIONS = [
  { value: 'pantry', label: 'Pantry', icon: '🥫' },
  { value: 'fridge', label: 'Fridge', icon: '🧊' },
  { value: 'freezer', label: 'Freezer', icon: '❄️' },
  { value: 'other', label: 'Other', icon: '📦' },
];


const initialFormState = {
  id: null,
  name: '',
  quantity: '',
  unit: '',
  dailyUsage: '',
  location: 'pantry',
};

function sortByDaysLeft(items) {
  return [...items].sort((a, b) => {
    const aDays = calculateDaysLeft(a.quantity, a.dailyUsage);
    const bDays = calculateDaysLeft(b.quantity, b.dailyUsage);
    return aDays - bDays;
  });
}

function getLocationDisplay(value) {
  if (!value) return '📦 Unassigned';
  const match = LOCATION_OPTIONS.find((option) => option.value === value);
  return match ? `${match.icon} ${match.label}` : `📦 ${value}`;
}

export default function Inventory({ items, onUpsertItem, onDeleteItem }) {
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState('');

  const isEditing = Boolean(formState.id);

  const sortedItems = useMemo(() => sortByDaysLeft(items), [items]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      setError('Name is required.');
      return;
    }

    const quantity = Number(formState.quantity);
    const dailyUsage = Number(formState.dailyUsage);

    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }

    if (!Number.isFinite(dailyUsage) || dailyUsage <= 0) {
      setError('Daily usage must be greater than zero.');
      return;
    }

    const payload = {
      id: formState.id ?? (crypto.randomUUID?.() || String(Date.now())),
      name: formState.name.trim(),
      quantity,
      unit: formState.unit.trim(),
      dailyUsage,
      location: formState.location || 'other',
      updatedAt: new Date().toISOString(),
      createdAt: formState.id ? formState.createdAt : new Date().toISOString(),
    };

    onUpsertItem(payload);
    resetForm();
  };

  const handleEdit = (item) => {
    setFormState({
      id: item.id,
      name: item.name,
      quantity: String(item.quantity ?? ''),
      unit: item.unit ?? '',
      dailyUsage: String(item.dailyUsage ?? ''),
      location: item.location ?? 'other',
      createdAt: item.createdAt,
    });
    setError('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this item from your essentials inventory?')) {
      onDeleteItem(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Essentials Inventory</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track supplies, usage rates, locations, and the number of days remaining.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
          >
            {isEditing ? 'Cancel edit' : 'Reset'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Drinking water"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
            <input
              type="number"
              min="0"
              step="0.1"
              name="quantity"
              value={formState.quantity}
              onChange={handleChange}
              placeholder="20"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
            <input
              name="unit"
              value={formState.unit}
              onChange={handleChange}
              placeholder="liters"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated daily usage</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                name="dailyUsage"
                value={formState.dailyUsage}
                onChange={handleChange}
                placeholder="5"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">per day</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
            <select
              name="location"
              value={formState.location}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {LOCATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="ml-auto inline-flex items-center justify-center rounded-lg bg-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40"
            >
              {isEditing ? 'Update item' : 'Add item'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No items yet. Add your first essential to start tracking.
          </div>
        ) : (
          sortedItems.map((item) => {
            const daysLeft = calculateDaysLeft(item.quantity, item.dailyUsage);
            const isLow = Number.isFinite(daysLeft) && daysLeft < 3;
            const urgencyEmoji = isLow ? '⚠️' : '✅';

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center md:justify-between ${
                  isLow
                    ? 'border-amber-400 bg-amber-50 shadow-amber-100/60 dark:border-amber-500 dark:bg-amber-500/10'
                    : 'border-gray-200 bg-white shadow-gray-100 dark:border-gray-700'
                }`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {urgencyEmoji} {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getLocationDisplay(item.location)} · {item.quantity} {item.unit}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uses {item.dailyUsage}
                    {item.unit ? ` ${item.unit}` : ''} per day
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center md:gap-6">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {Number.isFinite(daysLeft) ? `${daysLeft} days left` : 'Usage not set'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-light dark:hover:text-brand-light"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
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
