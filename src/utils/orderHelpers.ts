import { TakeOutFulfillmentKind } from "@/types/enum";
import { type DocumentData, Timestamp } from "firebase/firestore";

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  return value as Date;
}

export function mapOrderDoc(id: string, data: DocumentData): Order {
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    fulfillment:
      data.fulfillment?.kind === "scheduled"
        ? {
            ...data.fulfillment,
            scheduledAt: toDate(data.fulfillment.scheduledAt),
          }
        : data.fulfillment,
  } as Order;
}

export function formatOrderDate(date: Date): string {
  if (!date) return "";
  const datePart = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 7) {
    return `${digits.slice(0, -7)} ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }
  return `${digits.slice(0, -4)}-${digits.slice(-4)}`;
}

export function fulfillmentIsScheduled(order: Order): boolean {
  return order.fulfillment?.kind === TakeOutFulfillmentKind.Scheduled;
}

export function fulfillmentScheduledAt(order: Order): Date | undefined {
  return order.fulfillment?.kind === TakeOutFulfillmentKind.Scheduled
    ? order.fulfillment.scheduledAt
    : undefined;
}
