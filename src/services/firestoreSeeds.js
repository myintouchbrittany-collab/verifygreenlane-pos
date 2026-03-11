import { DEFAULT_STORE_ID, DEFAULT_STORE_NAME } from "./storeConfig";

export const seedStores = [
  {
    id: DEFAULT_STORE_ID,
    name: DEFAULT_STORE_NAME,
    code: DEFAULT_STORE_ID,
    timezone: "America/Chicago",
    status: "active",
  },
];

export const seedStaffUsers = [
  {
    uid: "seed-staff-user",
    email: "staff@greenlane.com",
    displayName: "Greenlane Staff",
    role: "pickup",
    defaultStoreId: DEFAULT_STORE_ID,
    storeIds: [DEFAULT_STORE_ID],
    isActive: true,
  },
];
