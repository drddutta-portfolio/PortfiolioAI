/** Approved 19:00 IST dispatch window; does not infer exchange OPEN status. */
export function bankMaintenanceExecutionWindow(sessionDate: string, now: number): boolean {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || !Number.isFinite(now)) return false
 const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
 }).formatToParts(new Date(now))
 const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ""
 const localDate = `${value("year")}-${value("month")}-${value("day")}`
 // Grants expire within 30 minutes; permitting later starts cannot extend grant validity.
 return sessionDate === localDate && Number(value("hour")) >= 19
}
