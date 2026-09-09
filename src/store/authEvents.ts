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
