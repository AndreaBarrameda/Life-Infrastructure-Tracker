import { useMemo, useState } from 'react';

const roles = ['Strategist', 'Quartermaster', 'Scout', 'Guardian'];

function generateInviteCode() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HHT-${random}`;
}

export default function Household({ members, onAddMember, onRemoveMember, points, streak }) {
  const [formState, setFormState] = useState({ name: '', email: '', role: roles[0] });
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [message, setMessage] = useState('');

  const teamScore = useMemo(() => {
    const memberPoints = members.reduce((acc, member) => acc + (member.points ?? 0), 0);
    return points + memberPoints;
  }, [members, points]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setMessage('Name is required to add a member.');
      return;
    }

    const newMember = {
      id: crypto.randomUUID?.() || String(Date.now()),
      name: formState.name.trim(),
      email: formState.email.trim(),
      role: formState.role,
      inviteCode,
      streak: Math.floor(Math.random() * 5),
    };

    onAddMember(newMember);
    setInviteCode(generateInviteCode());
    setFormState({ name: '', email: '', role: roles[0] });
    setMessage('Invite sent! Share the code or link below.');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Household Guild</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Build a crew of family or housemates. Everyone&apos;s actions boost the household score, streaks, and quests.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member name</label>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Alex Reyes"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (optional)</label>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Household role</label>
            <select
              name="role"
              value={formState.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light/40"
            >
              Invite member
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-brand-light">{message}</p>}

        <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
          <p className="font-semibold">Invite link</p>
          <p className="mt-1 text-xs">Share this code so others can join your household party.</p>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900">
            <span>{inviteCode}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Expires in 48h</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leaderboard</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Total household score combines everyone&apos;s points.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
              <span>Household score</span>
              <span>{teamScore}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300">
              <span>Your streak</span>
              <span>{streak} days</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No members yet—invite someone to start a friendly rivalry.
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{member.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role: {member.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-300">Streak {member.streak ?? 0}d</span>
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member.id)}
                      className="rounded-full border border-red-200 px-2 py-1 text-xs text-red-500 transition hover:border-red-300 hover:text-red-600 dark:border-red-500/40 dark:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Seasonal Challenge</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            🎃 October Preparedness Challenge: keep all bills current and maintain 5 essentials above 3 days remaining.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• Log daily restocks for bonus points.</li>
            <li>• Earn the “Resilient Household” badge to unlock animated confetti rewards.</li>
            <li>• Reach 1000 points for a surprise reward suggestion from the AI.</li>
          </ul>
          <div className="mt-4 rounded-xl border border-brand-light/30 bg-brand-light/10 px-4 py-3 text-sm text-brand-light">
            Keep the household health bar above 90% for three consecutive days to unlock the title “Chief Household Strategist”.
          </div>
        </div>
      </div>
    </div>
  );
}
