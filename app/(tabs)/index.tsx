import OrderCard from "@/components/OrderCard";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { ActivityIndicator, FlatList, Text } from "react-native";

export default function LiveOrdersScreen() {
  const { orders, loading } = useLiveOrders();

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
        <Text className="text-base text-gray-500">No live orders</Text>
      </SafeAreaViewWrapper>
    );
  }

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <FlatList
        className="flex-1"
        contentContainerClassName="p-4"
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </SafeAreaViewWrapper>
  );
}
