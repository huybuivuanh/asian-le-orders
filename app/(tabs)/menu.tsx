import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useCategories } from "@/hooks/useCategories";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useItemOptions } from "@/hooks/useItemOptions";
import { useOptionGroups } from "@/hooks/useOptionGroups";
import {
  buildMenuItemViewModel,
  type MenuItemViewModel,
} from "@/utils/menuViewModel";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
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
  const { categories, loading: categoriesLoading } = useCategories();
  const { items, loading: itemsLoading } = useMenuItems();
  const { optionGroups, loading: optionGroupsLoading } = useOptionGroups();
  const { options, loading: optionsLoading } = useItemOptions();
  const [search, setSearch] = useState("");
  const [showDisabledOnly, setShowDisabledOnly] = useState(false);

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

    const viewModelsByItemId = new Map(
      items.map((item) => [
        item.id,
        buildMenuItemViewModel(item, optionGroupsById, optionsById, now),
      ]),
    );

    const matchesSearch = (vm: MenuItemViewModel) => {
      if (!term) return true;
      if (vm.item.name.toLowerCase().includes(term)) return true;
      return vm.optionGroups.some((group) =>
        group.options.some((o) => o.option.name.toLowerCase().includes(term)),
      );
    };

    const hasDisabledOption = (vm: MenuItemViewModel) =>
      vm.optionGroups.some((group) =>
        group.options.some((o) => o.availability.state === "sold-out"),
      );

    const matchesDisabledFilter = (vm: MenuItemViewModel) =>
      !showDisabledOnly ||
      vm.availability.state === "sold-out" ||
      hasDisabledOption(vm);

    const filteredItems = items.filter((item) => {
      const vm = viewModelsByItemId.get(item.id);
      return vm != null && matchesSearch(vm) && matchesDisabledFilter(vm);
    });

    const orderedCategories = [
      ...categories,
      {
        id: OTHER_CATEGORY_ID,
        name: "Other",
        order: Number.MAX_SAFE_INTEGER,
      } as FoodCategory,
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
  }, [categories, items, optionGroups, options, search, showDisabledOnly, now]);

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <View className="px-4 pt-6 pb-3">
        <Text className="text-2xl font-semibold tracking-tight text-foreground">Menu</Text>
      </View>

      <View className="flex-row items-center gap-2 px-4 pb-3">
        <View className="flex-1 flex-row items-center gap-2 rounded-lg border border-foreground/15 bg-white px-3 py-2.5">
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            className="flex-1 text-base text-foreground focus:outline-none"
            placeholder="Search items"
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          className={`flex-row items-center gap-1.5 rounded-lg border px-3 py-2.5 ${
            showDisabledOnly
              ? "border-foreground bg-foreground"
              : "border-foreground/15 bg-white"
          }`}
          onPress={() => setShowDisabledOnly((prev) => !prev)}
        >
          <Ionicons
            name="funnel"
            size={16}
            color={showDisabledOnly ? colors.white : colors.muted}
          />
          <Text
            className={`text-sm font-medium ${
              showDisabledOnly ? "text-white" : "text-foreground/70"
            }`}
          >
            Disabled Items
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-foreground/60">
            {showDisabledOnly ? "No disabled items" : "No matching items"}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(vm) => vm.item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="mt-4 rounded-t-xl border border-foreground/10 bg-white px-4 pt-4 pb-3">
              <Text className="text-base font-semibold text-foreground">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: vm, index, section }) => {
            const isLast = index === section.data.length - 1;
            const isSoldOut = vm.availability.state === "sold-out";
            const disabledOptionCount = vm.optionGroups.reduce(
              (sum, group) =>
                sum +
                group.options.filter((o) => o.availability.state === "sold-out")
                  .length,
              0,
            );
            return (
              <View
                className={`border-x border-t border-foreground/10 bg-white px-4 ${
                  isLast ? "rounded-b-xl border-b" : ""
                }`}
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
                      <View className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    )}
                    <View className="flex-1">
                      <Text
                        className={`text-base ${isSoldOut ? "text-foreground/40 line-through" : "text-foreground"}`}
                        numberOfLines={1}
                      >
                        {vm.item.name}
                      </Text>
                      {!isSoldOut && disabledOptionCount > 0 && (
                        <Text className="mt-0.5 text-xs text-red-600">
                          {disabledOptionCount}{" "}
                          {disabledOptionCount === 1 ? "option" : "options"} sold
                          out
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaViewWrapper>
  );
}
