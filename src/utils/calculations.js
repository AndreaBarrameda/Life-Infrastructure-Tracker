export function calculateDaysLeft(quantity, dailyUsage) {
  const qty = Number(quantity);
  const usage = Number(dailyUsage);
  if (!Number.isFinite(qty) || qty < 0) return 0;
  if (!Number.isFinite(usage) || usage <= 0) return Infinity;
  return Math.round((qty / usage) * 10) / 10;
}

export function daysUntil(dateString) {
  if (!dateString) return Infinity;
  const today = new Date();
  const target = new Date(dateString);
  const diff = target.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
