/**
 * Date and label formatting for screen copy.
 *
 * Timestamps are stored and returned as UTC (the pool is opened with
 * `timezone: 'Z'`). Every function here renders through an explicit
 * `timeZone`, so the same row always produces the same string regardless of
 * where the Node process happens to be running — a server in another region
 * cannot silently shift "Today" to "Yesterday".
 *
 * These are pure string helpers with no database or environment coupling, so
 * they are safe to import from either side of the boundary.
 */

export const DISPLAY_TIMEZONE = 'Asia/Kolkata'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Calendar parts of an instant *as seen in* `timeZone`. */
function partsIn(date, timeZone) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date)

  const value = (type) => formatted.find((part) => part.type === type)?.value

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')) % 24,
    minute: Number(value('minute')),
    weekday: value('weekday'),
  }
}

function parse(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** `10:45 AM` */
export function timeLabel(value, timeZone = DISPLAY_TIMEZONE) {
  const date = parse(value)
  if (!date) return ''
  const { hour, minute } = partsIn(date, timeZone)
  const suffix = hour < 12 ? 'AM' : 'PM'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}:${String(minute).padStart(2, '0')} ${suffix}`
}

/** `Today` · `Yesterday` · `Jun 20` — and `Jun 20, 2025` once the year differs. */
export function dayLabel(value, { timeZone = DISPLAY_TIMEZONE, now = new Date() } = {}) {
  const date = parse(value)
  if (!date) return ''

  const then = partsIn(date, timeZone)
  const today = partsIn(now, timeZone)
  const asNumber = (p) => p.year * 10000 + p.month * 100 + p.day
  const difference = asNumber(today) - asNumber(then)

  if (difference === 0) return 'Today'
  if (difference === 1) return 'Yesterday'

  const label = `${MONTHS[then.month - 1]} ${then.day}`
  return then.year === today.year ? label : `${label}, ${then.year}`
}

/** `Today · 10:45 AM` — the activity-row timestamp. */
export function dayTimeLabel(value, options = {}) {
  const date = parse(value)
  if (!date) return ''
  return `${dayLabel(date, options)} · ${timeLabel(date, options.timeZone)}`
}

/** `Thu, 24 Jul · 3:00 PM` — the scheduled-session timestamp. */
export function scheduleLabel(value, timeZone = DISPLAY_TIMEZONE) {
  const date = parse(value)
  if (!date) return ''
  const { weekday, day, month } = partsIn(date, timeZone)
  const shortWeekday = WEEKDAYS.includes(weekday) ? weekday : weekday.slice(0, 3)
  return `${shortWeekday}, ${day} ${MONTHS[month - 1]} · ${timeLabel(date, timeZone)}`
}

/** `today` · `yesterday` · `Jun 18` — reads inside "Applied …". */
export function agoLabel(value, options = {}) {
  const label = dayLabel(value, options)
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : label
}

/** True when the instant falls within the last seven days. */
export function isThisWeek(value, { now = new Date() } = {}) {
  const date = parse(value)
  if (!date) return false
  const days = (now - date) / 86_400_000
  return days >= 0 && days <= 7
}

/** True when the instant falls in the current calendar month, in `timeZone`. */
export function isThisMonth(value, { timeZone = DISPLAY_TIMEZONE, now = new Date() } = {}) {
  const date = parse(value)
  if (!date) return false
  const then = partsIn(date, timeZone)
  const today = partsIn(now, timeZone)
  return then.year === today.year && then.month === today.month
}

/** `3` → `3rd Year` */
export function yearLabel(year) {
  if (!year) return ''
  const remainderTen = year % 10
  const remainderHundred = year % 100
  let suffix = 'th'
  if (remainderTen === 1 && remainderHundred !== 11) suffix = 'st'
  else if (remainderTen === 2 && remainderHundred !== 12) suffix = 'nd'
  else if (remainderTen === 3 && remainderHundred !== 13) suffix = 'rd'
  return `${year}${suffix} Year`
}

/** `Shantanu Ghuriani` → `Shantanu G.` — the short form the tables use. */
export function shortName(name) {
  if (!name) return ''
  const [first, ...rest] = name.split(' ')
  return rest.length > 0 ? `${first} ${rest.at(-1).charAt(0)}.` : first
}

/** Joins non-empty parts with the middot the references use throughout. */
export function joinMeta(...parts) {
  return parts.filter((part) => part !== null && part !== undefined && part !== '').join(' · ')
}
