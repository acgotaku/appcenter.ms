import { useRef, useEffect } from "react";
import { uniqueId } from "lodash";
import { loadingStore } from "@root/stores/loading-store";

export function useLoading(loading: boolean): void {
  const { current: id } = useRef(uniqueId());
  useEffect(() => {
    if (loading) {
      loadingStore.startLoading(id);
    } else {
      loadingStore.stopLoading(id);
    }
    return () => loadingStore.stopLoading(id);
  }, [loading, id]);
}
