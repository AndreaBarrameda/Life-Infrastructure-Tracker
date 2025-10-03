import { useMemo, useState } from 'react';
import { daysUntil } from '../utils/calculations';
import { getUpcomingBills } from '../utils/reminders';

const initialBillState = {
  id: null,
  name: '',
  amount: '',
  dueDate: '',
  recurring: false,
  lastPaidDate: null,
};

function sortByDueDate(bills) {
  const parseDate = (value) => {
    if (!value) return Infinity;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : Infinity;
  };
  return [...bills].sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function Bills({ bills, onUpsertBill, onDeleteBill, onMarkBillPaid }) {
  const [formState, setFormState] = useState(initialBillState);
  const [error, setError] = useState('');
  const isEditing = Boolean(formState.id);

  const sortedBills = useMemo(() => sortByDueDate(bills), [bills]);
  const upcomingBills = useMemo(() => getUpcomingBills(bills), [bills]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormState(initialBillState);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!formState.dueDate) {
      setError('Due date is required.');
      return;
    }

    const amount = Number(formState.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const payload = {
      id: formState.id ?? (crypto.randomUUID?.() || String(Date.now())),
      name: formState.name.trim(),
      amount,
      dueDate: formState.dueDate,
      recurring: Boolean(formState.recurring),
      lastPaidDate: formState.lastPaidDate ?? null,
      updatedAt: new Date().toISOString(),
      createdAt: formState.id ? formState.createdAt : new Date().toISOString(),
    };

    onUpsertBill(payload);
    resetForm();
  };

  const handleEdit = (bill) => {
    setFormState({
      id: bill.id,
      name: bill.name,
      amount: String(bill.amount ?? ''),
      dueDate: bill.dueDate ? bill.dueDate.slice(0, 10) : '',
      recurring: Boolean(bill.recurring),
      lastPaidDate: bill.lastPaidDate ?? null,
      createdAt: bill.createdAt,
    });
    setError('');
  };

  const handleMarkPaid = (bill) => {
    onMarkBillPaid?.(bill.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this bill?')) {
      onDeleteBill(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Bills & Utilities</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stay ahead of due dates and recurring expenses.</p>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Electricity"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="amount"
              value={formState.amount}
              onChange={handleChange}
              placeholder="120"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due date</label>
            <input
              type="date"
              name="dueDate"
              value={formState.dueDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              name="recurring"
              checked={formState.recurring}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-brand-light focus:ring-brand-light"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recurring bill
            </label>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="ml-auto inline-flex items-center justify-center rounded-lg bg-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40"
            >
              {isEditing ? 'Update bill' : 'Add bill'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {sortedBills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No bills tracked yet. Add a bill to start seeing reminders.
          </div>
        ) : (
          sortedBills.map((bill) => {
            const days = daysUntil(bill.dueDate);
            const dueSoon = Number.isFinite(days) && days >= 0 && days <= 7;
            const urgencyEmoji = dueSoon ? '🔥' : days < 0 ? '⚠️' : '✅';

            return (
              <div
                key={bill.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center md:justify-between ${
                  dueSoon
                    ? 'border-blue-400 bg-blue-50 shadow-blue-100/60 dark:border-blue-500 dark:bg-blue-500/10'
                    : 'border-gray-200 bg-white shadow-gray-100'
                }`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{urgencyEmoji} {bill.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(bill.amount)} · due {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}
                  </p>
                  {bill.lastPaidDate && (
                    <p className="text-xs text-emerald-500 dark:text-emerald-300">Paid on {new Date(bill.lastPaidDate).toLocaleDateString()}</p>
                  )}
                  {bill.recurring && <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">Recurring</span>}
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center md:gap-6">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {Number.isFinite(days)
                      ? days > 0
                        ? `Due in ${days} ${days === 1 ? 'day' : 'days'}`
                        : days === 0
                          ? 'Due today'
                          : `${Math.abs(days)} days past due`
                      : 'Due date not set'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(bill)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 transition hover:border-brand-light hover:text-brand-light dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-light dark:hover:text-brand-light"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(bill)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      Mark paid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bill.id)}
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

      {upcomingBills.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
          🔔 {upcomingBills.length} bill{upcomingBills.length > 1 ? 's' : ''} due within a week. Stay current to avoid late fees.
        </div>
      )}
    </div>
  );
}
