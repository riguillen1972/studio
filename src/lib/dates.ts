// Date-picker helpers. A due date picked as YYYY-MM-DD means the end of that day in the teacher's time zone.

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const dueDateToIso = (date: string) => (date ? new Date(`${date}T23:59:00`).toISOString() : null);
