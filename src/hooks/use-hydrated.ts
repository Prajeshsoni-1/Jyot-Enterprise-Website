"use client";

import { useEffect, useState } from "react";

/**
 * False during server render and the first client paint, true once React has
 * hydrated. Forms use it to keep the submit button disabled until their
 * JavaScript handler is attached, so a fast click can never trigger a native
 * browser submit that would discard the enquiry.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
