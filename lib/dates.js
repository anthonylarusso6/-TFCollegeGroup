// EST ("America/New_York") date helpers. The whole app keys "today" off EST, and
// this logic was previously re-inlined ~30 times — centralizing it keeps the
// timezone rule (never use UTC for a calendar day) in one place.

// A Date whose local fields (getFullYear/getMonth/getDate/getHours…) read as EST.
export const nowEST = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));

// "YYYY-MM-DD" from a Date's local fields.
export const dateKey = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Today's "YYYY-MM-DD" in EST.
export const todayEST = () => dateKey(nowEST());

// "YYYY-MM-DD" (EST) for an arbitrary timestamp/date input.
export const estKey = (ts) =>
  dateKey(new Date(new Date(ts).toLocaleString("en-US", { timeZone: "America/New_York" })));
