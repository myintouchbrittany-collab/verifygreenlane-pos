export const DEFAULT_STORE_ID = "greenlane-main";
export const DEFAULT_STORE_NAME = "Greenlane Main";

export function matchesActiveStore(record, storeId = DEFAULT_STORE_ID) {
  if (!record) {
    return false;
  }

  return !record.storeId || record.storeId === storeId;
}
