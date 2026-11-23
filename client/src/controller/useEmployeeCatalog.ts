import { useEffect, useState } from "react";
import axios from "axios";

export type CatalogItem = { id: number; name: string };
export type CatalogKind = "departments" | "positions";
export type EmployeeCatalog = Record<CatalogKind, CatalogItem[]>;
export const catalogUrl = "http://localhost:5000/api/employee-catalog";

export function useEmployeeCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<EmployeeCatalog | null>(null);
  const [error, setError] = useState(false);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    axios.get<EmployeeCatalog>(catalogUrl, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setCatalog(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [enabled, requestId]);

  const reload = () => {
    setError(false);
    setCatalog(null);
    setRequestId(current => current + 1);
  };

  return { catalog, error, reload, setCatalog };
}
