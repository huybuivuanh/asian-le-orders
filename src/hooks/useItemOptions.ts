import { subscribeToItemOptions } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useItemOptions() {
  const [options, setOptions] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToItemOptions(
      (data) => {
        setOptions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Item options snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { options, loading };
}
