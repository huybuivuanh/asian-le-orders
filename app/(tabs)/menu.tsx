import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useDemoCategories } from "@/hooks/useDemoCategories";
import { useDemoMenuItems } from "@/hooks/useDemoMenuItems";
import { useItemOptions } from "@/hooks/useItemOptions";
import { useOptionGroups } from "@/hooks/useOptionGroups";
import { buildMenuItemViewModel } from "@/utils/menuViewModel";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const OTHER_CATEGORY_ID = "__other__";
const NOW_REFRESH_MS = 60_000;

export default function MenuScreen() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useDemoCategories();
  const { items, loading: itemsLoading } = useDemoMenuItems();
  const { optionGroups, loading: optionGroupsLoading } = useOptionGroups();
  const { options, loading: optionsLoading } = useItemOptions();
  const [search, setSearch] = useState("");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), NOW_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const loading =
    categoriesLoading || itemsLoading || optionGroupsLoading || optionsLoading;

  const sections = useMemo(() => {
    const optionGroupsById = new Map(optionGroups.map((g) => [g.id, g]));
    const optionsById = new Map(options.map((o) => [o.id, o]));
    const term = search.trim().toLowerCase();

    const filteredItems = term
      ? items.filter((item) => item.name.toLowerCase().includes(term))
      : items;

    const viewModelsByItemId = new Map(
      filteredItems.map((item) => [
        item.id,
        buildMenuItemViewModel(item, optionGroupsById, optionsById, now),
      ]),
    );

    const orderedCategories = [
      ...categories,
      {
        id: OTHER_CATEGORY_ID,
        name: "Other",
        order: Number.MAX_SAFE_INTEGER,
      } as DemoCategory,
    ];

    return orderedCategories
      .map((category) => ({
        title: category.name,
        data: filteredItems
          .filter((item) =>
            category.id === OTHER_CATEGORY_ID
              ? !item.categoryIds || item.categoryIds.length === 0
              : (item.categoryIds ?? []).includes(category.id),
          )
          .map((item) => viewModelsByItemId.get(item.id))
          .filter((vm): vm is NonNullable<typeof vm> => vm != null),
      }))
      .filter((section) => section.data.length > 0);
  }, [categories, items, optionGroups, options, search, now]);

  return (
    <SafeAreaViewWrapper backgroundColor="#F3F4F6" includeBottomInset={false}>
      <View className="px-4 pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Menu</Text>
      </View>

      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search items"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-500">No menu items</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(vm) => vm.item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="mt-4 rounded-t-2xl border-b border-gray-100 bg-white px-4 pt-4 pb-3">
              <Text className="text-lg font-bold text-gray-900">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: vm, index, section }) => {
            const isLast = index === section.data.length - 1;
            const isSoldOut = vm.availability.state === "sold-out";
            return (
              <View
                className={`bg-white px-4 ${isLast ? "rounded-b-2xl" : "border-b border-gray-100"}`}
              >
                <TouchableOpacity
                  className="flex-row items-center justify-between py-4"
                  onPress={() =>
                    router.push({
                      pathname: "/menu-item/[id]",
                      params: { id: vm.item.id },
                    })
                  }
                >
                  <View className="flex-1 flex-row items-center gap-2">
                    {isSoldOut && (
                      <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    <Text
                      className="flex-1 text-base text-gray-900"
                      numberOfLines={1}
                    >
                      {vm.item.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaViewWrapper>
  );
}
