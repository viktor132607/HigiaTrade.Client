export interface ApiCategory {
  id: string;
  name: string;
  imageURI?: string;
  imageUri?: string;
}

type CollectionEnvelope<T> = {
  items?: T[];
  data?: T[];
  result?: T[];
  results?: T[];
  value?: T[];
  records?: T[];
  totalCount?: number;
  total?: number;
  count?: number;
};

export const normalizeCollection = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as CollectionEnvelope<T>;

  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.records)) return data.records;

  return [];
};

export const getTotalCount = (payload: unknown, fallback: number): number => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as CollectionEnvelope<unknown>;
  const value = data.totalCount ?? data.total ?? data.count;

  return typeof value === "number" ? value : fallback;
};

export const getCategoryImage = (category: ApiCategory): string => {
  return category.imageUri || category.imageURI || "";
};
