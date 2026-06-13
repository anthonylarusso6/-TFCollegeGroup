// Lightweight haptic feedback — no-ops where unsupported (iOS Safari ignores vibrate,
// but Android/PWA honors it, and it never throws). Keep patterns short and meaningful.
const buzz = (pattern) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
};

export const hTap = () => buzz(8);           // light UI tap (nav, toggle, pick)
export const hSelect = () => buzz(14);       // a deliberate selection
export const hSuccess = () => buzz([12, 40, 24]); // action confirmed (check-in, save)
export const hError = () => buzz([30, 50, 30]);   // something went wrong
export const hCelebrate = () => buzz([10, 30, 10, 30, 40]); // milestone / streak

export default { hTap, hSelect, hSuccess, hError, hCelebrate };
