import { useLoading } from "../hooks/use-loading";

export function GlobalProgress({ loading }: { loading: boolean }) {
  useLoading(loading);
  return null;
}
