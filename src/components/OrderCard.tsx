import { acceptOrder, updateOrderStatus } from "@/services/orders";
import { submitOrderToPrintQueue } from "@/services/printQueue";
import { OrderStatus, TakeOutFulfillmentKind } from "@/types/enum";
import {
  formatOrderDate,
  formatPhone,
  fulfillmentIsScheduled,
  fulfillmentScheduledAt,
} from "@/utils/orderHelpers";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const READY_MINUTES_STEP = 1;
const READY_MINUTES_MIN = 5;
const READY_MINUTES_MAX = 120;

type OrderCardProps = {
  order: Order;
  showActions?: boolean;
  defaultReadyMinutes?: number;
};

export default function OrderCard({
  order,
  showActions = true,
  defaultReadyMinutes,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scheduled = fulfillmentIsScheduled(order);
  const scheduledAt = fulfillmentScheduledAt(order);

  const existingReadyTimeMinutes =
    order.fulfillment?.kind === TakeOutFulfillmentKind.Immediate
      ? order.fulfillment.readyTimeMinutes
      : undefined;

  const [readyMinutes, setReadyMinutes] = useState(
    existingReadyTimeMinutes ?? defaultReadyMinutes ?? 0,
  );

  useEffect(() => {
    if (existingReadyTimeMinutes != null || defaultReadyMinutes == null) return;
    setReadyMinutes(defaultReadyMinutes);
  }, [defaultReadyMinutes, existingReadyTimeMinutes]);

  const cardBg =
    order.status === OrderStatus.Cancelled
      ? "bg-red-100 border-red-200"
      : order.status === OrderStatus.Completed
        ? "bg-green-100 border-green-200"
        : order.status === OrderStatus.New
          ? "bg-[#ffc8dd] border-[#f4a6c6]"
          : scheduled
            ? "bg-orange-100 border-orange-200"
            : "bg-blue-100 border-blue-200";

  const isPrinted = order.printed ?? false;
  const isPaid = order.paid ?? false;

  const hidePaidBadge =
    order.status === OrderStatus.Cancelled ||
    (order.status === OrderStatus.Completed && !isPaid);

  const statusPillClass =
    order.status === OrderStatus.New
      ? "bg-pink-100"
      : order.status === OrderStatus.InProgress
        ? "bg-blue-100"
        : order.status === OrderStatus.Completed
          ? "bg-green-100"
          : "bg-red-200";

  const statusTextClass =
    order.status === OrderStatus.New
      ? "text-pink-700"
      : order.status === OrderStatus.InProgress
        ? "text-blue-700"
        : order.status === OrderStatus.Completed
          ? "text-green-700"
          : "text-red-700";

  const statusLabel =
    order.status === OrderStatus.InProgress ? "In Progress" : order.status;

  const showOrderActions = showActions && order.status !== OrderStatus.New;

  const handleComplete = async () => {
    try {
      await updateOrderStatus(order.id, OrderStatus.Completed);
    } catch (error) {
      console.error("Failed to complete order:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await updateOrderStatus(order.id, OrderStatus.Cancelled);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const handlePrint = async () => {
    try {
      await submitOrderToPrintQueue(order);
    } catch (error) {
      console.error("Failed to print order:", error);
    }
  };

  return (
    <View className={`${cardBg} p-4 mb-3 rounded-xl shadow-sm border`}>
      <TouchableOpacity
        className="flex-row justify-between items-center"
        onPress={() => setExpanded((prev) => !prev)}
      >
        <View>
          <Text className="font-semibold text-gray-800 text-base">
            Order #{order.orderNumber}
          </Text>
          {order.customerName ? (
            <Text className="font-semibold text-gray-800 text-base">
              Name: {order.customerName}
            </Text>
          ) : null}
          {order.phoneNumber ? (
            <Text className="font-semibold text-gray-800 text-base">
              Phone #: {formatPhone(order.phoneNumber)}
            </Text>
          ) : null}
          {order.fulfillment?.kind === TakeOutFulfillmentKind.Immediate &&
            order.fulfillment.readyTimeMinutes != null && (
              <Text className="font-semibold text-gray-800 text-base">
                Ready In: {order.fulfillment.readyTimeMinutes} min
              </Text>
            )}
          <Text className="font-semibold text-gray-800 text-base">
            Ordered At: {formatOrderDate(order.createdAt)}
          </Text>
          {scheduled && scheduledAt && (
            <Text className="font-semibold text-gray-800 text-base">
              Preorder: {formatOrderDate(scheduledAt)}
            </Text>
          )}
        </View>

        <View className="items-end gap-2">
          <View
            className={`px-3 py-1 rounded-full ${isPrinted ? "bg-green-100" : "bg-yellow-100"}`}
          >
            <Text
              className={`text-xs font-semibold ${isPrinted ? "text-green-700" : "text-yellow-700"}`}
            >
              {isPrinted ? "Printed" : "Not Printed"}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${isPaid ? "bg-green-100" : "bg-gray-100"} ${hidePaidBadge ? "opacity-0" : ""}`}
          >
            <Text
              className={`text-xs font-semibold ${isPaid ? "text-green-700" : "text-gray-700"}`}
            >
              {isPaid ? "Paid" : "Unpaid"}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusPillClass}`}>
            <Text className={`text-xs font-semibold ${statusTextClass}`}>
              {statusLabel}
            </Text>
          </View>
          {showOrderActions && (
            <TouchableOpacity
              className="bg-green-500 px-4 py-2 rounded-lg"
              onPress={handleComplete}
            >
              <Text className="text-sm font-bold text-white">Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showActions && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          {!scheduled && order.status === OrderStatus.New && (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-gray-700">
                Ready In (min)
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
                  disabled={readyMinutes <= READY_MINUTES_MIN}
                  onPress={() =>
                    setReadyMinutes((prev) =>
                      Math.max(READY_MINUTES_MIN, prev - READY_MINUTES_STEP),
                    )
                  }
                >
                  <Text className="text-lg font-bold text-gray-700">−</Text>
                </TouchableOpacity>
                <Text className="text-base font-bold text-gray-900 w-8 text-center">
                  {readyMinutes}
                </Text>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
                  disabled={readyMinutes >= READY_MINUTES_MAX}
                  onPress={() =>
                    setReadyMinutes((prev) =>
                      Math.min(READY_MINUTES_MAX, prev + READY_MINUTES_STEP),
                    )
                  }
                >
                  <Text className="text-lg font-bold text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {order.status === OrderStatus.New && (
            <TouchableOpacity
              className="bg-emerald-500 py-3 rounded-lg"
              onPress={async () => {
                try {
                  await acceptOrder(order, readyMinutes);
                } catch (error) {
                  console.error("Failed to accept order:", error);
                }
              }}
            >
              <Text className="text-center text-white font-bold">Accept</Text>
            </TouchableOpacity>
          )}

          {order.status === OrderStatus.InProgress && (
            <TouchableOpacity className="bg-sky-600 py-3 rounded-lg">
              <Text className="text-center text-white font-bold">
                Order Ready
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {expanded && (
        <View className="mt-3 border-t border-gray-200 pt-2">
          {order.orderItems.map((item, index) => (
            <View
              key={index}
              className="mb-2.5 rounded-2xl border border-stone-200/90 bg-white px-3 py-3.5 shadow-sm"
            >
              <View className="flex-row items-baseline justify-between gap-2">
                <Text
                  className="flex-1 text-lg font-semibold text-stone-900"
                  numberOfLines={3}
                >
                  <Text className="font-bold text-stone-600">
                    {item.quantity}
                  </Text>
                  <Text className="text-stone-400"> × </Text>
                  {item.name}
                </Text>
                <Text className="text-lg font-bold text-stone-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>

              {item.options && item.options.length > 0 && (
                <View className="mt-2 border-t border-stone-100 pt-2">
                  {item.options.map((option, optIndex) => (
                    <Text
                      key={optIndex}
                      className="text-[15px] leading-5 text-stone-600"
                    >
                      <Text className="text-stone-400">· </Text>
                      {option.quantity > 1 ? `${option.quantity}× ` : ""}
                      {option.name}
                      {option.price > 0 &&
                        `  ·  $${(option.price * option.quantity).toFixed(2)}`}
                    </Text>
                  ))}
                </View>
              )}

              {item.instructions ? (
                <View className="mt-2.5 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
                  <Text className="text-[15px] italic leading-5 text-stone-600">
                    {"“"}
                    {item.instructions}
                    {"”"}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}

          <View className="mt-2 p-2 border-t border-gray-200">
            <View className="flex-row justify-between mb-1">
              <Text className="text-base text-gray-700">Subtotal</Text>
              <Text className="text-base text-gray-700">
                ${order.taxBreakDown.subTotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-base text-gray-700">PST (6%)</Text>
              <Text className="text-base text-gray-700">
                ${order.taxBreakDown.pst.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-base text-gray-700">GST (5%)</Text>
              <Text className="text-base text-gray-700">
                ${order.taxBreakDown.gst.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-base font-semibold text-gray-800">
                Total
              </Text>
              <Text className="text-base font-bold text-gray-900">
                ${order.taxBreakDown.total.toFixed(2)}
              </Text>
            </View>
          </View>

          {showOrderActions && (
            <View className="flex-row justify-between gap-2 mt-3">
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-md"
                onPress={handlePrint}
              >
                <Text className="text-center text-white font-semibold text-sm">
                  Print
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 py-3 rounded-md"
                onPress={handleCancel}
              >
                <Text className="text-center text-white font-semibold text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-500 py-3 rounded-md"
                onPress={handleComplete}
              >
                <Text className="text-center text-white font-semibold text-sm">
                  Complete
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!showActions && (
            <TouchableOpacity
              className="bg-blue-500 py-3 rounded-md mt-3"
              onPress={handlePrint}
            >
              <Text className="text-center text-white font-semibold text-sm">
                Print
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
