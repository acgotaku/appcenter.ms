export class SimpleEmitter<T = any> {
  private subscribers: Set<(arg?: T) => void> = new Set();

  public subscribe(subscriber: (arg?: T) => void) {
    this.subscribers.add(subscriber);
  }

  public unsubscribe(subscriber: (arg?: T) => void) {
    return this.subscribers.delete(subscriber);
  }

  public emit(arg?: T) {
    this.subscribers.forEach((subscriber) => subscriber(arg));
  }
}
