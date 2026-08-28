import OrderCard from "@/components/OrderCard";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useOrderHistory } from "@/hooks/useOrderHistory";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

const LIST_STYLE = {
  flex: 1,
  minHeight: 0,
  width: "100%" as const,
  alignSelf: "stretch" as const,
};

const LIST_CONTENT_STYLE = {
  flexGrow: 1,
  alignSelf: "stretch" as const,
  width: "100%" as const,
  padding: 16,
};

export default function OrderHistoryScreen() {
  const { orders, loading, hasMore, loadMore } = useOrderHistory();

  if (loading) {
    return (
      <SafeAreaViewWrapper
        className="items-center justify-center"
        includeBottomInset={false}
      >
        <ActivityIndicator />
      </SafeAreaViewWrapper>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaViewWrapper
        className="items-center justify-center"
        includeBottomInset={false}
      >
        <Text className="text-base text-gray-500">No order history</Text>
      </SafeAreaViewWrapper>
    );
  }

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <FlatList
        style={LIST_STYLE}
        contentContainerStyle={LIST_CONTENT_STYLE}
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => (
          <OrderCard order={item} showActions={false} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaViewWrapper>
  );
}
