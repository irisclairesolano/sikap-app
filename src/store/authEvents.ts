type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeAuthChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthChanged(): void {
  listeners.forEach((fn) => fn());
}
