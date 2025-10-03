import { useMemo, useState } from 'react';
import { calculateDaysLeft } from '../utils/calculations';
import { getLowInventoryItems, getUpcomingBills } from '../utils/reminders';

const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const LOCATION_META = {
  pantry: { label: 'Pantry', icon: '🥫' },
  fridge: { label: 'Fridge', icon: '🧊' },
  freezer: { label: 'Freezer', icon: '❄️' },
  other: { label: 'Storage', icon: '📦' },
};

function getLocationTag(value) {
  if (!value) return '📦 Unassigned';
  const meta = LOCATION_META[value];
  return meta ? `${meta.icon} ${meta.label}` : `📦 ${value}`;
}

const initialMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    content: 'Greetings, household hero! I am your Guardian of Supplies and Bill Buster rolled into one. Ask for quests, status updates, or strategies to keep your life infrastructure thriving.',
  },
];

function buildInventoryContext(items) {
  if (!items.length) {
    return 'No essentials are being tracked right now.';
  }

  const lines = items.map((item) => {
    const daysLeft = calculateDaysLeft(item.quantity, item.dailyUsage);
    const daysText = Number.isFinite(daysLeft) ? `${daysLeft} day(s) left` : 'usage missing';
    const locationTag = getLocationTag(item.location);
    return `${item.name} — ${locationTag}, quantity: ${item.quantity} ${item.unit || ''}, daily usage: ${item.dailyUsage}, ${daysText}`;
  });

  const lowItems = getLowInventoryItems(items);
  const lowSummary = lowItems.length
    ? `⚠️ Low supplies (${lowItems.length}): ${lowItems
        .map((item) => `${item.name}${item.location ? ` (${item.location})` : ''}`)
        .join(', ')}`
    : '✅ No low supplies right now.';

  return `${lines.join('\n')}\n${lowSummary}`;
}

function buildGoalsContext(goals) {
  if (!goals.length) {
    return 'No personal goals tracked yet.';
  }

  const lines = goals.map((goal) => {
    const target = goal.target ?? 0;
    const progress = goal.progress ?? 0;
    const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
    const status = percent >= 100 ? 'complete' : percent >= 50 ? 'on track' : 'needs attention';
    return `${goal.name} — ${percent}% (${progress}/${target}${goal.unit ? ` ${goal.unit}` : ''}), cadence: ${goal.cadence}, status: ${status}`;
  });

  return lines.join('\n');
}

function buildBillsContext(bills) {
  if (!bills.length) {
    return 'No bills are tracked right now.';
  }

  const lines = bills.map((bill) => {
    const dueDateObj = bill.dueDate ? new Date(bill.dueDate) : null;
    const hasValidDueDate = dueDateObj && Number.isFinite(dueDateObj.getTime());
    const dueIso = hasValidDueDate ? dueDateObj.toISOString().slice(0, 10) : 'unscheduled';
    const dueMs = hasValidDueDate ? dueDateObj.getTime() : NaN;
    const nowMs = Date.now();
    const diffDays = Number.isFinite(dueMs) ? Math.floor((dueMs - nowMs) / (1000 * 60 * 60 * 24)) : NaN;
    const dueText = Number.isFinite(diffDays)
      ? diffDays > 0
        ? `due in ${diffDays} day(s)`
        : diffDays === 0
          ? 'due today'
          : `${Math.abs(diffDays)} day(s) past due`
      : 'due date unknown';
    const recurring = bill.recurring ? 'recurring' : 'one-off';
    return `${bill.name} — amount: ${bill.amount}, due: ${dueIso}, ${dueText}, ${recurring}`;
  });

  const upcoming = getUpcomingBills(bills);
  const upcomingSummary = upcoming.length
    ? `🔥 Upcoming bills (${upcoming.length}): ${upcoming.map((bill) => bill.name).join(', ')}`
    : '✅ No bills due within the next week.';

  return `${lines.join('\n')}\n${upcomingSummary}`;
}

export default function Assistant({ inventory, bills, goals = [], points = 0, streak = 0, level = "Bronze", onReminderAcknowledged }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const personaContext = `You are an enthusiastic game master who narrates household logistics like epic quests.
Current points: ${points}. Current streak: ${streak} days. Level: ${level}. Provide positive reinforcement, loss-aversion nudges, and titles like Guardian of Supplies or Bill Buster. Encourage momentum on personal goals when progress falls behind.`;
  const contextMessage = useMemo(() => {
    const inventoryContext = buildInventoryContext(inventory);
    const billsContext = buildBillsContext(bills);
    const goalsContext = buildGoalsContext(goals);
    return `${personaContext}\n\nInventory snapshot:\n${inventoryContext}\n\nBills snapshot:\n${billsContext}\n\nGoals briefing:\n${goalsContext}`;
  }, [inventory, bills, goals, personaContext]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: userContent };
    const conversation = [...messages, userMessage];
    setMessages([...conversation, { id: `assistant-pending-${Date.now()}`, role: 'assistant', content: '…', pending: true }]);
    setInput('');
    setIsLoading(true);
    setError('');

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      setMessages([...conversation, {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'OpenAI API key is missing. Add VITE_OPENAI_API_KEY to your environment to enable the assistant.',
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: contextMessage },
            ...conversation.map(({ role, content }) => ({ role, content })),
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantReply = data.choices?.[0]?.message?.content?.trim();
      if (!assistantReply) {
        throw new Error('No response from model');
      }

      setMessages([...conversation, { id: `assistant-${Date.now()}`, role: 'assistant', content: assistantReply }]);
      onReminderAcknowledged?.();
    } catch (apiError) {
      console.error('Assistant error', apiError);
      setError('Unable to reach the assistant. Check your network connection and API key.');
      setMessages([...conversation, {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I could not reach the assistant right now. Please try again later.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <header className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assistant</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ask about low inventory, upcoming bills, or get planning tips.</p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'assistant'
                  ? 'bg-brand-light/10 text-brand-dark dark:bg-brand-light/20 dark:text-white'
                  : 'ml-auto bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={1}
              placeholder="Ask the assistant…"
              className="min-h-[48px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
