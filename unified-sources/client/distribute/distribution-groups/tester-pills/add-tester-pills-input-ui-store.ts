import { observable, computed, action } from "mobx";
import { IUser } from "@lib/common-interfaces";

export interface Email extends Partial<IUser> {
  email?: string;
}

export interface Tag extends Email {
  display_name?: string;
  isUser: boolean;
}

export class AddTesterPillsInputUIStore {
  private _tags = observable.array<Tag>([]);

  @observable
  private _autocompleteItems: any[] = [];

  @computed
  get tags() {
    return this._tags.slice();
  }

  @computed
  get autocompleteItems(): Email[] {
    return this._autocompleteItems.slice();
  }

  @action
  clear() {
    this._tags.clear();
  }

  @action
  addTag(tagInfo: Tag) {
    this._tags.push(tagInfo);
  }

  @action
  deleteTag(tag: Tag): void {
    this._tags.remove(tag);
  }

  addAutocompleteItems(autocompleteItems: Email[]) {
    this._autocompleteItems.push(autocompleteItems);
  }
}
