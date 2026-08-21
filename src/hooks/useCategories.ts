import { subscribeToDemoCategories } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useDemoCategories() {
  const [categories, setCategories] = useState<DemoCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToDemoCategories(
      (data) => {
        setCategories(data);
        setLoading(false);
      },
      (error) => {
        console.error("Demo categories snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { categories, loading };
}
