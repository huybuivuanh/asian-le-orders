import { db } from "@/lib/firebase";
import { KitchenType } from "@/types/enum";
import { sortAlphabetically } from "@/utils/sort";
import {
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

const KITCHEN_TYPES = Object.values(KitchenType) as string[];
const AVAILABILITY_DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

function toCreatedAt(raw: unknown): Date {
  if (raw && typeof raw === "object" && typeof (raw as Timestamp).toDate === "function") {
    return (raw as Timestamp).toDate();
  }
  return new Date();
}

function mapStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const filtered = raw.filter((value): value is string => typeof value === "string");
  return filtered.length > 0 ? filtered : undefined;
}

function mapImageItemField(raw: unknown): ImageItem | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.url !== "string") return undefined;
  return {
    id: typeof value.id === "string" ? value.id : undefined,
    name: typeof value.name === "string" ? value.name : "",
    url: value.url,
  };
}

// Only a Firestore Timestamp decodes; anything else (including malformed)
// means "not sold out" — a safe default, unlike pausedUntil.
function mapSoldOutUntil(raw: unknown): Date | undefined {
  return raw instanceof Timestamp ? raw.toDate() : undefined;
}

// A present-but-empty raw object decodes to `{}`, not undefined — that
// distinction ("unavailable every day" vs "no restriction") must survive
// the round trip. Never collapse the two.
function mapAvailability(raw: unknown): Availability | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const source = raw as Record<string, unknown>;
  const result: Availability = {};
  for (const day of AVAILABILITY_DAY_KEYS) {
    const range = source[day];
    if (
      range &&
      typeof range === "object" &&
      typeof (range as Record<string, unknown>).startTime === "string" &&
      typeof (range as Record<string, unknown>).endTime === "string"
    ) {
      result[day] = {
        startTime: (range as Record<string, unknown>).startTime as string,
        endTime: (range as Record<string, unknown>).endTime as string,
      };
    }
  }
  return result;
}

// MenuItem.optionGroupIds supports two shapes for backward compat: the
// new { optionGroupId, order }[] form, and a legacy plain string[] form
// where each entry's array index becomes its order.
function normalizeOptionGroupRefs(raw: unknown): OptionGroupId[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const refs: OptionGroupId[] = [];
  raw.forEach((entry, index) => {
    if (typeof entry === "string") {
      refs.push({ optionGroupId: entry, order: index });
      return;
    }
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as Record<string, unknown>).optionGroupId === "string"
    ) {
      const value = entry as Record<string, unknown>;
      refs.push({
        optionGroupId: value.optionGroupId as string,
        order: typeof value.order === "number" ? value.order : index,
      });
    }
  });

  if (refs.length === 0) return undefined;
  return refs.sort((a, b) => a.order - b.order);
}

function mapCategoryDoc(id: string, d: DocumentData): FoodCategory {
  return {
    id,
    name: d.name ?? "",
    description: typeof d.description === "string" ? d.description : undefined,
    itemIds: mapStringArray(d.itemIds),
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: toCreatedAt(d.createdAt),
  };
}

function mapMenuItemDoc(id: string, d: DocumentData): MenuItem {
  return {
    id,
    name: d.name ?? "",
    description: typeof d.description === "string" ? d.description : undefined,
    price: typeof d.price === "number" && Number.isFinite(d.price) ? d.price : 0,
    image: mapImageItemField(d.image),
    optionGroupIds: normalizeOptionGroupRefs(d.optionGroupIds),
    categoryIds: mapStringArray(d.categoryIds),
    kitchenType: KITCHEN_TYPES.includes(d.kitchenType)
      ? d.kitchenType
      : KitchenType.Other,
    availability: mapAvailability(d.availability),
    soldOutUntil: mapSoldOutUntil(d.soldOutUntil),
    createdAt: toCreatedAt(d.createdAt),
  };
}

function mapOptionGroupDoc(id: string, d: DocumentData): OptionGroup {
  return {
    id,
    name: d.name ?? "",
    minSelection: typeof d.minSelection === "number" ? d.minSelection : 0,
    maxSelection: typeof d.maxSelection === "number" ? d.maxSelection : 1,
    multipleOptionQuantity: d.multipleOptionQuantity === true,
    optionIds: mapStringArray(d.optionIds),
    itemIds: mapStringArray(d.itemIds),
    defaultOptionId:
      typeof d.defaultOptionId === "string" ? d.defaultOptionId : undefined,
    createdAt: toCreatedAt(d.createdAt),
  };
}

function mapItemOptionDoc(id: string, d: DocumentData): ItemOption {
  return {
    id,
    name: d.name ?? "",
    price: typeof d.price === "number" && Number.isFinite(d.price) ? d.price : 0,
    groupIds: mapStringArray(d.groupIds),
    availability: mapAvailability(d.availability),
    soldOutUntil: mapSoldOutUntil(d.soldOutUntil),
    createdAt: toCreatedAt(d.createdAt),
  };
}

export function subscribeToCategories(
  onData: (categories: FoodCategory[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  const q = query(collection(db, "categories"), orderBy("order"));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => mapCategoryDoc(docSnap.id, docSnap.data())),
      );
    },
    onError,
  );
}

export function subscribeToMenuItems(
  onData: (items: MenuItem[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "menuItems"),
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        mapMenuItemDoc(docSnap.id, docSnap.data()),
      );
      onData(sortAlphabetically(items, (item) => item.name));
    },
    onError,
  );
}

export function subscribeToOptionGroups(
  onData: (optionGroups: OptionGroup[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "optionGroups"),
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => mapOptionGroupDoc(docSnap.id, docSnap.data())),
      );
    },
    onError,
  );
}

export function subscribeToItemOptions(
  onData: (options: ItemOption[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "options"),
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => mapItemOptionDoc(docSnap.id, docSnap.data())),
      );
    },
    onError,
  );
}

export async function updateMenuItemSoldOutUntil(
  itemId: string,
  soldOutUntil: Date | null,
) {
  await updateDoc(doc(db, "menuItems", itemId), {
    soldOutUntil: soldOutUntil ? Timestamp.fromDate(soldOutUntil) : null,
  });
}

export async function updateItemOptionSoldOutUntil(
  optionId: string,
  soldOutUntil: Date | null,
) {
  await updateDoc(doc(db, "options", optionId), {
    soldOutUntil: soldOutUntil ? Timestamp.fromDate(soldOutUntil) : null,
  });
}
