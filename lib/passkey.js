// Face ID / Touch ID sign-in (WebAuthn passkeys), shared by the athlete and
// coach pages.
//
// Sign-in is "discoverable": we ask iOS for ANY passkey saved for this site and
// learn who it belongs to from the passkey's user handle (set at registration
// as the athlete id, or "coach_<id>"). That way Face ID keeps working when the
// browser's local storage is gone — iOS clears it after ~7 days without a visit,
// and a Home Screen app has separate storage from Safari.
//
// IMPORTANT (iOS): call passkeySignIn / passkeyRegister directly inside the tap
// handler with nothing awaited before it, or Safari drops the user gesture and
// the Face ID sheet won't appear.

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const rpId = () => window.location.hostname;

export async function passkeyAvailable() {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential || !navigator.credentials) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) { return false; }
}

// → { userHandle: string|null, credId: string } — throws on cancel/error
export async function passkeySignIn() {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: rpId(),
      allowCredentials: [],               // any passkey for this site
      userVerification: "required",
      timeout: 60000,
      hints: ["client-device"],           // prefer the phone's own Face ID (Apple Passwords)
    },
  });
  if (!assertion) throw Object.assign(new Error("No passkey returned"), { name: "NotAllowedError" });
  let userHandle = null;
  try { if (assertion.response && assertion.response.userHandle && assertion.response.userHandle.byteLength) userHandle = new TextDecoder().decode(assertion.response.userHandle); } catch (e) {}
  return { userHandle, credId: b64(assertion.rawId) };
}

// → credId string — throws on cancel/error
export async function passkeyRegister({ userId, name }) {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "TF College Group", id: rpId() },
      user: { id: new TextEncoder().encode(String(userId)), name: name || String(userId), displayName: name || String(userId) },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      // platform + resident key → Face ID / Touch ID saved in Apple Passwords
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required" },
      hints: ["client-device"],
      timeout: 60000,
    },
  });
  return b64(credential.rawId);
}

// Remember (per browser) that this person uses Face ID. Only a hint for the UI;
// sign-in never depends on it.
export function rememberPasskey(key, credId) {
  try { localStorage.setItem(key, JSON.stringify({ credId, rpId: rpId() })); } catch (e) {}
}

export const isCancel = (e) => !e || e.name === "NotAllowedError" || e.name === "AbortError";

export function passkeyErrorText(e, action = "sign in") {
  const n = (e && e.name) || "Error";
  if (n === "SecurityError") return `Face ID can't ${action} on this web address. Open www.tfcollegegroup.com in Safari and try again.`;
  if (n === "NotSupportedError") return "This browser doesn't support Face ID sign-in. Open the site in Safari (not an in-app browser).";
  if (n === "InvalidStateError") return "Face ID is already set up for this account on this phone.";
  return `Face ID couldn't ${action} (${n}). Check that Face ID is on and Settings → [your name] → iCloud → Passwords & Keychain is turned on, then try again.`;
}
