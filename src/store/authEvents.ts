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
let idSubmittedUserId: number | null = null;

export function markIdSubmitted(userId?: number): void {
  idSubmittedAt = Date.now();
  idSubmittedUserId = userId ?? null;
}

export function clearIdSubmitted(): void {
  idSubmittedAt = 0;
  idSubmittedUserId = null;
}

export function wasIdRecentlySubmitted(windowMs = 120000, userId?: number): boolean {
  if (idSubmittedAt <= 0 || Date.now() - idSubmittedAt >= windowMs) {
    return false;
  }
  if (userId !== undefined && idSubmittedUserId !== null && idSubmittedUserId !== userId) {
    return false;
  }
  return true;
}
