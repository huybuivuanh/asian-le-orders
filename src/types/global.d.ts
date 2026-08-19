import type {
  DayOfWeek,
  KitchenType,
  OrderStatus,
  TakeOutFulfillmentKind,
} from "@/types/enum";

declare global {
  interface FoodCategory {
    id: string;
    name: string;
    description?: string;
    itemIds?: string[];
    order: number;
    createdAt: Date;
  }

  interface ImageItem {
    id?: string;
    name: string;
    url: string;
  }

  interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: ImageItem;
    options?: string[];
    categoryIds?: string[];
    createdAt: Date;
  }

  interface DailySpecialItem {
    id: string;
    name: string;
    price: number;
    options?: string[];
    dayOfWeekIds?: string[];
    createdAt: Date;
  }

  interface DailySpecial {
    id: string;
    dayOfWeek: DayOfWeek;
    timeRange: TimeRange;
    itemIds?: string[];
    createdAt: Date;
  }
  interface TimeRange {
    startTime: string;
    endTime: string;
  }
  interface StoreHour {
    id: string;
    days: string;
    time: string;
    order: number;
  }

  interface OptionGroupId {
    optionGroupId: string;
    order: number;
  }

  // Undefined = available every day, all hours. Present with day keys =
  // available ONLY on those days, ONLY inside that day's range. Present but
  // `{}` = unavailable every day — a distinct state from undefined, reachable
  // via the admin "restrict" toggle with no days set. Never merge with `??`.
  interface Availability {
    mon?: TimeRange;
    tue?: TimeRange;
    wed?: TimeRange;
    thu?: TimeRange;
    fri?: TimeRange;
    sat?: TimeRange;
    sun?: TimeRange;
  }

  type DemoCategory = FoodCategory;

  interface DemoMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: ImageItem;
    optionGroupIds?: OptionGroupId[];
    categoryIds?: string[];
    kitchenType: KitchenType;
    availability?: Availability;
    // Absent = available. A date = sold out until that moment; the
    // INDEFINITE_PAUSE sentinel (see storeSettingsHelpers) = sold out until
    // manually restocked. Same convention as StoreSettings.pausedUntil,
    // except optional/absent here instead of null since this is a sparse
    // per-item field rather than a singleton settings doc.
    soldOutUntil?: Date;
    createdAt: Date;
  }

  interface OptionGroup {
    id: string;
    name: string;
    minSelection: number;
    maxSelection: number;
    multipleOptionQuantity: boolean;
    optionIds?: string[];
    itemIds?: string[];
    defaultOptionId?: string;
    createdAt: Date;
  }

  interface ItemOption {
    id: string;
    name: string;
    price: number;
    groupIds?: string[];
    availability?: Availability;
    soldOutUntil?: Date;
    createdAt: Date;
  }

  interface DayHours {
    isOpen: boolean;
    open: string;
    close: string;
  }

  interface Holiday {
    id: string;
    from: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD — if absent, single day
  }

  interface StoreSettings {
    // null = accepting orders. A date = paused until that moment; a
    // far-future sentinel (see INDEFINITE_PAUSE in storeSettingsHelpers)
    // represents "paused indefinitely, until manually resumed."
    pausedUntil: Date | null;
    timezone: string;
    waitTime: number;
    hours: {
      mon: DayHours;
      tue: DayHours;
      wed: DayHours;
      thu: DayHours;
      fri: DayHours;
      sat: DayHours;
      sun: DayHours;
    };
    holidays: Holiday[];
  }

  // --- Orders (written by the customer-facing website, read here for order
  // history/printing — see that repo's orders-schema.md for the full contract). ---

  interface OrderItemOption {
    name: string;
    price: number;
    quantity: number;
  }

  interface OrderItem {
    menuItemId: string;
    name: string;
    price: number; // per-unit price INCLUDING selected options
    quantity: number;
    options?: OrderItemOption[];
    instructions?: string;
    kitchenType: KitchenType;
  }

  interface OrderTaxBreakDown {
    subTotal: number;
    pst: number;
    gst: number;
    total: number;
  }

  type OrderFulfillment =
    | { kind: TakeOutFulfillmentKind.Immediate; readyTimeMinutes?: number }
    | { kind: TakeOutFulfillmentKind.Scheduled; scheduledAt: Date };

  interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    fulfillment: OrderFulfillment;
    customerName: string;
    phoneNumber: string;
    customerEmail: string;
    orderItems: OrderItem[];
    taxBreakDown: OrderTaxBreakDown;
    paid: boolean;
    printed: boolean;
    createdAt: Date;
  }
}

export {};
