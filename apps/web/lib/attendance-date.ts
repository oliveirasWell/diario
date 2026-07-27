export function attendanceDayKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export function normalizeAttendanceDate(date: Date | string) {
  return new Date(`${attendanceDayKey(date)}T12:00:00.000Z`);
}

export function eachDayBetween(start: Date, end: Date) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const days: Date[] = [];
  for (let day = new Date(start); day <= end; day = new Date(day.getTime() + oneDayMs)) {
    days.push(new Date(day));
  }
  return days;
}

export function sessionDayBounds(date: Date | string) {
  const dayKey = attendanceDayKey(date);
  return {
    gte: new Date(`${dayKey}T00:00:00.000Z`),
    lte: new Date(`${dayKey}T23:59:59.999Z`),
  };
}
