import { Autocomplete, AutocompleteProps } from "./autocomplete";

export function createAutocomplete<T extends {}>() {
  type TypedAutocomplete = new (props: AutocompleteProps<T>) => Autocomplete<T>;
  return Autocomplete as TypedAutocomplete;
}

export const AnyAutocomplete = createAutocomplete<any>();
