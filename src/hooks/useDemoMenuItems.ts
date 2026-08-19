import { subscribeToDemoMenuItems } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useDemoMenuItems() {
  const [items, setItems] = useState<DemoMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToDemoMenuItems(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (error) => {
        console.error("Demo menu items snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { items, loading };
}
