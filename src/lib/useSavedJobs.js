import { useCallback, useEffect, useState } from "react";
import { localStore } from "@/api/localStore";

function toArray(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return result.items ?? [];
}

export function useSavedJobs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await localStore.entities.SavedJob.filter({}, { sort: "-created_date", limit: 500 });
      setItems(toArray(page));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}