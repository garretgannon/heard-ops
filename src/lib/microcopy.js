/**
 * Industry Mode microcopy — restaurant-industry easter eggs.
 * Off by default. Unlocked by tapping the logo 5 times.
 * Never used in safety, HR, compliance, or incident workflows.
 */

const LINES = {
  emptyApprovals: [
    "Inbox zero. Tell no one or they'll find something.",
    "Nothing pending. Don't make eye contact with the GM.",
    "All clear. Enjoy the 45 seconds before something else lands.",
  ],
  emptyReceiving: [
    "No vendor drama today. Suspicious, but we'll take it.",
    "Nothing pending. The vendors are being cooperative.",
    "Clean slate. The walk-in is probably fine too.",
  ],
  emptyConflicts: [
    "No conflicts. Screenshot this historic moment.",
    "Zero conflicts. The scheduling gods are pleased.",
    "Clean build. Tell the GM to stop touching the schedule.",
  ],
  manyConflicts: [
    "Schedule has entered survival mode.",
    "This many conflicts. Deep breaths. You've seen worse.",
    "Conflicts detected. The spreadsheet strikes again.",
  ],
  loading: [
    "Checking if the walk-in is still closed...",
    "Looking for the prep list someone definitely finished...",
    "Counting ramekins that disappeared in 2019...",
    "Asking FOH and BOH to agree on one thing...",
    "Locating the server who 'just stepped outside'...",
    "Reviewing who called out for the third weekend in a row...",
    "Cross-referencing with the clipboard no one can find...",
  ],
  shiftPublished: [
    "Published. May the gods of labor law smile upon you.",
    "Schedule is live. The group chat has started.",
    "Posted. Someone will ask about it in 20 minutes.",
  ],
  eightySixAdded: [
    "Added to 86. May it return stronger tomorrow.",
    "86'd. The kitchen has been notified. Probably.",
    "Noted. Chef is already blaming the vendor.",
  ],
  eightySixCleared: [
    "86 board cleared. Chef has entered a rare peaceful state.",
    "All clear. The menu is whole again.",
    "Cleared. Until tonight.",
  ],
  receivingIssue: [
    "Vendor issue logged. We'll pretend to be surprised.",
    "Issue recorded. The follow-up games begin.",
    "Noted. Classic.",
  ],
  shiftClaimed: [
    "Shift claimed. A hero has emerged.",
    "Picked up. Someone is getting a favor owed.",
    "Shift covered. A miracle of scheduling.",
  ],
};

export function isIndustryModeOn() {
  try { return localStorage.getItem('heardos_industry_mode') === 'true'; } catch { return false; }
}

export function setIndustryMode(on) {
  try { localStorage.setItem('heardos_industry_mode', on ? 'true' : 'false'); } catch {}
}

export function isEasterEggFound() {
  try { return localStorage.getItem('heardos_easter_egg') === 'true'; } catch { return false; }
}

export function markEasterEggFound() {
  try { localStorage.setItem('heardos_easter_egg', 'true'); } catch {}
}

/**
 * Returns humorous copy for empty states and subtitles.
 * Only fires if industry mode is on, and only ~60% of the time (so it stays surprising).
 * Returns `fallback` otherwise.
 */
export function getMicrocopy(category, fallback = '') {
  if (!isIndustryModeOn()) return fallback;
  const lines = LINES[category];
  if (!lines || lines.length === 0) return fallback;
  if (Math.random() > 0.6) return fallback;
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * Returns humorous copy for one-shot actions (toasts, confirmations).
 * Always fires if mode is on — since these happen once per user action, not on every render.
 * Returns `fallback` otherwise.
 */
export function getActionCopy(category, fallback = '') {
  if (!isIndustryModeOn()) return fallback;
  const lines = LINES[category];
  if (!lines || lines.length === 0) return fallback;
  return lines[Math.floor(Math.random() * lines.length)];
}
