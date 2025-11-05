export class UniqueElementStack<HTMLElement> extends Array<HTMLElement> {
  private constructor(items: Array<HTMLElement>) {
    super(...items);
  }
  static create<HTMLElement>(): UniqueElementStack<HTMLElement> {
    return Object.create(UniqueElementStack.prototype);
  }

  add(newItem: unknown) {
    // make sure that the same element isn't already present in our stack
    if (!this.some((existingItem: unknown) => (existingItem as Node).isEqualNode(newItem as Node))) {
      this.push(newItem as HTMLElement);
    }
  }

  public take() {
    return this.pop();
  }
}
