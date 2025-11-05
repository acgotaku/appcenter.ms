import { observable, computed, action } from "mobx";
import { DestinationWrapper } from "../../models/destination-wrapper";

export interface DestinationPillUIStore {
  tags: DestinationWrapper[];
  invalidEmails: string[];
  autocompleteItems: DestinationWrapper[];
  validatingEmails: boolean;
  selectedDestinationIds: string[];
  tagIdsMapping: { [id: string]: DestinationWrapper };

  add: (destination: DestinationWrapper) => void;
  setTags: (destinations: DestinationWrapper[]) => void;
  clear: () => void;
  clearInvalidEmails: () => void;
  deleteTag: (tag: DestinationWrapper) => void;
  saveTag: (tag: DestinationWrapper) => void;
  addInvalidEmail: (value: string) => void;
  validateEmail: (email: string) => void;
  emailValidated: (email: string) => void;
}

export class DestinationPillsTagStore implements DestinationPillUIStore {
  @observable
  private _tags = observable.array<DestinationWrapper>([]);
  private _invalidEmails = observable.array<string>([]);
  private _emailsToValidate = observable.array<string>([]);

  @observable
  private _autocompleteItems = [];

  @computed
  get tags() {
    return this._tags.slice();
  }

  @computed
  public get tagIdsMapping(): { [id: string]: DestinationWrapper } {
    return this.tags.reduce((map, destination) => {
      map[destination.destination.id!] = destination;
      return map;
    }, {});
  }

  @computed
  get invalidEmails() {
    return this._invalidEmails.slice();
  }

  @computed
  get validatingEmails() {
    return this._emailsToValidate.length > 0;
  }

  @computed
  get autocompleteItems(): DestinationWrapper[] {
    return this._autocompleteItems.slice();
  }

  @computed
  public get selectedDestinationIds(): string[] {
    return this.tags.map((tag) => tag.destination.id!);
  }

  @action
  clear() {
    this._tags.clear();
  }

  @action
  clearInvalidEmails() {
    this._invalidEmails.clear();
  }

  @action
  setTags(destinations: DestinationWrapper[]) {
    this._tags = observable.array<DestinationWrapper>(destinations);
  }

  @action
  add(destination: DestinationWrapper) {
    this._tags.push(destination);
  }

  @action
  addInvalidEmail(email: string) {
    this._invalidEmails.push(email);
  }

  @action
  validateEmail(email: string) {
    this._emailsToValidate.push(email);
  }

  @action
  deleteTag(tag: DestinationWrapper) {
    this._tags.remove(tag);
  }

  @action
  deleteTagById(id: string) {
    if (this.selectedDestinationIds[id]) {
      this._tags.remove(this.selectedDestinationIds[id]);
    }
  }

  @action
  emailValidated(email: string) {
    this._emailsToValidate.remove(email);
  }

  @action
  saveTag(tag: DestinationWrapper): boolean {
    // TODO
    return true;
  }
}
