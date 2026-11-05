type Listener = () => void;

const listeners = new Set<Listener>();
let guestInitialRoute: 'Splash' | 'Login' | 'Welcome' = 'Splash';

export function setGuestInitialRoute(route: 'Splash' | 'Login' | 'Welcome'): void {
  guestInitialRoute = route;
}

export function getGuestInitialRoute(): 'Splash' | 'Login' | 'Welcome' {
  return guestInitialRoute;
}

export function subscribeAuthChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthChanged(): void {
  listeners.forEach((fn) => fn());
}

// Tracks when the user last submitted ID documents successfully. Used to ignore
// stale `/profile` responses (fetched before the upload committed) that would
// otherwise bounce the user from PendingVerify back to an empty IDUpload screen.
let idSubmittedAt = 0;

export function markIdSubmitted(): void {
  idSubmittedAt = Date.now();
}

export function clearIdSubmitted(): void {
  idSubmittedAt = 0;
}

export function wasIdRecentlySubmitted(windowMs = 120000): boolean {
  return idSubmittedAt > 0 && Date.now() - idSubmittedAt < windowMs;
}
