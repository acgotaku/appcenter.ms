export const mergeRefs = <T extends any = any>(...refs: (React.Ref<T> | React.LegacyRef<T> | undefined)[]) => (ref: T) => {
  refs.forEach((resolvableRef) => {
    if (typeof resolvableRef === "function") {
      resolvableRef(ref);
    } else if (resolvableRef && typeof resolvableRef === "object") {
      // @ts-ignore
      resolvableRef.current = ref;
    }
  });
};
