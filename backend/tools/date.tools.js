function daysUntil(dateString) {
  // Accept only YYYY-MM-DD.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Date must use YYYY-MM-DD format");
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const target = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible dates, such as 2026-02-30.
  if (
    target.getUTCFullYear() !== year ||
    target.getUTCMonth() !== month - 1 ||
    target.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }

  const now = new Date();

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((target.getTime() - today) / millisecondsPerDay);
}
function dayOfWeek(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Date must use YYYY-MM-DD format");
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return weekdays[date.getUTCDay()];
}

module.exports = {
  daysUntil,
  dayOfWeek,
};
