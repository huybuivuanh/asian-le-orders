import OrderCard from "@/components/OrderCard";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function LiveOrdersScreen() {
  const { orders, loading } = useLiveOrders();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-500">No live orders</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      contentContainerClassName="p-4"
      data={orders}
      keyExtractor={(order) => order.id}
      renderItem={({ item }) => <OrderCard order={item} />}
    />
  );
}
