import { subscribeToCategories } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useCategories() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCategories(
      (data) => {
        setCategories(data);
        setLoading(false);
      },
      (error) => {
        console.error("Categories snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { categories, loading };
}
