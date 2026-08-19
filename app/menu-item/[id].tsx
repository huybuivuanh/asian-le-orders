import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import SoldOutToggleRow from "@/components/SoldOutToggleRow";
import PauseOrderingModal from "@/components/PauseOrderingModal";
import { useDemoMenuItems } from "@/hooks/useDemoMenuItems";
import { useItemOptions } from "@/hooks/useItemOptions";
import { useOptionGroups } from "@/hooks/useOptionGroups";
import {
  updateItemOptionSoldOutUntil,
  updateMenuItemSoldOutUntil,
} from "@/services/menuData";
import { buildMenuItemViewModel, selectionRuleLabel } from "@/utils/menuViewModel";
import { formatPausedUntil } from "@/utils/storeSettingsHelpers";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SoldOutTarget =
  | { kind: "item" }
  | { kind: "option"; optionId: string; optionName: string };

const NOW_REFRESH_MS = 60_000;

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading: itemsLoading } = useDemoMenuItems();
  const { optionGroups, loading: optionGroupsLoading } = useOptionGroups();
  const { options, loading: optionsLoading } = useItemOptions();
  const [soldOutTarget, setSoldOutTarget] = useState<SoldOutTarget | null>(
    null,
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), NOW_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const loading = itemsLoading || optionGroupsLoading || optionsLoading;
  const item = items.find((i) => i.id === id);

  const viewModel = useMemo(() => {
    if (!item) return null;
    const optionGroupsById = new Map(optionGroups.map((g) => [g.id, g]));
    const optionsById = new Map(options.map((o) => [o.id, o]));
    return buildMenuItemViewModel(item, optionGroupsById, optionsById, now);
  }, [item, optionGroups, options, now]);

  const activeOption =
    soldOutTarget?.kind === "option"
      ? viewModel?.optionGroups
          .flatMap((g) => g.options)
          .find((o) => o.option.id === soldOutTarget.optionId)
      : undefined;

  const modalIsActive =
    soldOutTarget?.kind === "item"
      ? viewModel?.availability.state === "sold-out"
      : activeOption?.availability.state === "sold-out";

  const handleSoldOutSubmit = async (until: Date | null) => {
    const target = soldOutTarget;
    setSoldOutTarget(null);
    if (!target || !item) return;
    try {
      if (target.kind === "item") {
        await updateMenuItemSoldOutUntil(item.id, until);
      } else {
        await updateItemOptionSoldOutUntil(target.optionId, until);
      }
    } catch (error) {
      console.error("Failed to update sold-out status:", error);
    }
  };

  return (
    <SafeAreaViewWrapper
      backgroundColor="#F3F4F6"
      includeTopInset={false}
      includeBottomInset={false}
    >
      <Stack.Screen
        options={{
          title: item?.name ?? "Item",
          headerTitleAlign: "center",
          headerBackButtonDisplayMode: "minimal",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={12}
              className="pr-2"
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : !item || !viewModel ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-500">Item not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View className="bg-white rounded-2xl px-4">
            <SoldOutToggleRow
              label={item.name}
              isSoldOut={viewModel.availability.state === "sold-out"}
              onPress={() => setSoldOutTarget({ kind: "item" })}
            />
          </View>
          <Text className="text-sm text-gray-400 mt-3 px-1">
            ${item.price.toFixed(2)} · {item.kitchenType}
            {viewModel.availability.state === "sold-out"
              ? ` · Sold out ${formatPausedUntil(viewModel.availability.until)}`
              : ""}
          </Text>

          {viewModel.optionGroups.map((group) => (
            <View key={group.group.id} className="mt-6">
              <View className="bg-white rounded-2xl px-4">
                <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                  <Text className="text-lg font-bold text-gray-900">
                    {group.group.name}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {selectionRuleLabel(group.group)}
                  </Text>
                </View>
                {group.options.map(({ option, availability }, index) => (
                  <View
                    key={option.id}
                    className={
                      index < group.options.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    <SoldOutToggleRow
                      label={option.name}
                      isSoldOut={availability.state === "sold-out"}
                      onPress={() =>
                        setSoldOutTarget({
                          kind: "option",
                          optionId: option.id,
                          optionName: option.name,
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <PauseOrderingModal
        visible={soldOutTarget != null}
        isActive={modalIsActive ?? false}
        onSubmit={handleSoldOutSubmit}
        onCancel={() => setSoldOutTarget(null)}
        icon="🚫"
        title={
          soldOutTarget?.kind === "option"
            ? `Mark "${soldOutTarget.optionName}" Sold Out`
            : `Mark "${item?.name}" Sold Out`
        }
        subtitle="Hide it from customers until it's back in stock"
        resumeLabel="Mark Available Now"
        quickLabel="Quick Sold Out"
      />
    </SafeAreaViewWrapper>
  );
}
