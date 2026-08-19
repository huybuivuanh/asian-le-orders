import { subscribeToOptionGroups } from "@/services/menuData";
import { useEffect, useState } from "react";

export function useOptionGroups() {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToOptionGroups(
      (data) => {
        setOptionGroups(data);
        setLoading(false);
      },
      (error) => {
        console.error("Option groups snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { optionGroups, loading };
}
