import { subscribeToMenuItems } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMenuItems(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (error) => {
        console.error("Menu items snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { items, loading };
}
