# Firestore Schema for Verify Greenlane POS

This schema preserves the current React + Firebase app while moving the preorder and pickup workflow toward an `orders`-driven model.

## Design Priorities

- Keep current routes and existing staff/customer flows working.
- Keep Firebase Auth and Firestore as the core backend.
- Make all operational records store-aware with `storeId`.
- Keep customer identity and compliance data primarily on `customers`.
- Move preorder and pickup workflow toward `orders`.
- Let staff identity map to `staffUsers` by Firebase Auth `uid`.

## Recommended Collections

### `stores`

One document per dispensary location.

Important fields:

- `name`: display name for the store
- `code`: short internal code
- `timezone`: store-local timezone
- `status`: `active` or `inactive`
- `address`: object for street/city/state/postalCode
- `pickupConfig`: express pickup settings
- `menuConfig`: store-specific menu visibility rules

Example document:

```json
{
  "name": "Greenlane River North",
  "code": "greenlane-river-north",
  "timezone": "America/Chicago",
  "status": "active",
  "address": {
    "street1": "123 W Hubbard St",
    "city": "Chicago",
    "state": "IL",
    "postalCode": "60654"
  },
  "pickupConfig": {
    "expressEnabled": true,
    "pickupWindowMinutes": 30
  },
  "menuConfig": {
    "showSpecials": true,
    "allowPreorder": true
  },
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `staffUsers`

Maps Firebase Auth users to store access and role-based staff permissions.

Important fields:

- `uid`: Firebase Auth uid
- `email`
- `displayName`
- `role`: `admin`, `manager`, `budtender`, `pickup`
- `storeIds`: stores the staff user can access
- `defaultStoreId`
- `isActive`

Example document:

```json
{
  "uid": "firebase-auth-uid",
  "email": "staff@greenlane.com",
  "displayName": "Avery M",
  "role": "pickup",
  "storeIds": ["greenlane-main"],
  "defaultStoreId": "greenlane-main",
  "isActive": true,
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `customers`

Primary record for customer identity, compliance, and verification state.

Important fields:

- `storeId`
- `fullName`
- `phoneNumber`
- `dateOfBirth`
- `age`
- `idNumber`
- `idExpiration`
- `idUploadComplete`
- `idUploads`: filenames, URLs, audit metadata
- `is21Plus`
- `verificationStatus`: `pending`, `uploaded`, `verified`, `rejected`
- `verificationMethod`
- `lastOrderId`
- `lastOrderNumber`

Example document:

```json
{
  "storeId": "greenlane-main",
  "fullName": "Jordan Parker",
  "name": "Jordan Parker",
  "phoneNumber": "(555) 010-2299",
  "dateOfBirth": "1995-06-14",
  "age": 30,
  "idNumber": "P1234567",
  "idExpiration": "2028-06-14",
  "is21Plus": true,
  "verificationStatus": "verified",
  "verificationMethod": "scanner",
  "idUploadComplete": true,
  "idUploads": {
    "frontFileName": "front.jpg",
    "backFileName": "back.jpg",
    "frontDownloadUrl": "https://...",
    "backDownloadUrl": "https://..."
  },
  "lastOrderId": "order_abc123",
  "lastOrderNumber": "GL-456789",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `products`

Store-aware menu catalog. Can be global with per-store overrides, but the simplest path now is one product document per store SKU.

Important fields:

- `storeId`
- `name`
- `category`
- `strain`
- `size`
- `thc`
- `price`
- `specialPrice`
- `isActive`
- `inventory`: current quantity/status
- `tags`

Example document:

```json
{
  "storeId": "greenlane-main",
  "name": "Sunset Runtz",
  "category": "flower",
  "strain": "Hybrid",
  "size": "3.5g",
  "thc": "29%",
  "price": 38,
  "specialPrice": 34,
  "isActive": true,
  "inventory": {
    "inStock": true,
    "availableUnits": 42
  },
  "tags": ["happy-hour"],
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `specials`

Store-specific merchandising rules and promotional messaging.

Important fields:

- `storeId`
- `title`
- `details`
- `tag`
- `type`: `price_override`, `bundle`, `bogo`, `menu_banner`
- `productIds`
- `isActive`
- `startsAt`
- `endsAt`

Example document:

```json
{
  "storeId": "greenlane-main",
  "title": "Happy Hour Edibles",
  "details": "Save 15% on all gummies and chocolates before 5 PM.",
  "tag": "15% Off",
  "type": "price_override",
  "productIds": ["mango-gummies", "midnight-chews"],
  "isActive": true,
  "startsAt": "<timestamp>",
  "endsAt": "<timestamp>",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `orders`

This should become the operational source of truth for preorder, pickup, and completion.

Important fields:

- `storeId`
- `customerId`
- `orderNumber`
- `channel`: `preorder`, `walk_in`, `staff_created`
- `status`: `draft`, `submitted`, `id_uploaded`, `verified`, `checked_in`, `ready`, `completed`, `cancelled`
- `pickupStatus`: current customer-facing pickup state
- `pickupWindow`
- `pickupCode`
- `orderItems`
- `subtotal`
- `discount`
- `total`
- `specialsApplied`
- `checkedIn`
- `arrivalTime`
- `checkoutTime`
- `source`

Example document:

```json
{
  "storeId": "greenlane-main",
  "customerId": "customer_abc123",
  "orderNumber": "GL-456789",
  "channel": "preorder",
  "status": "id_uploaded",
  "pickupStatus": "Waiting",
  "pickupWindow": "Today 4:30 PM - 5:00 PM",
  "pickupCode": "{\"customerId\":\"customer_abc123\",\"orderNumber\":\"GL-456789\",\"type\":\"greenlane-express-pickup\"}",
  "orderItems": [
    {
      "productId": "sunset-runtz",
      "name": "Sunset Runtz",
      "quantity": 1,
      "price": 38,
      "specialPrice": 34
    }
  ],
  "subtotal": 38,
  "discount": 4,
  "total": 34,
  "specialsApplied": ["Happy Hour Edibles"],
  "checkedIn": false,
  "arrivalTime": "",
  "checkoutTime": "",
  "source": "Customer Preorder",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

### `pickupQueue`

Derived operational queue for fast staff screens. This can be maintained by client writes now and later by Cloud Functions.

Important fields:

- `storeId`
- `orderId`
- `customerId`
- `orderNumber`
- `customerName`
- `status`
- `pickupStatus`
- `checkedIn`
- `arrivalTime`
- `priority`
- `queueDate`

Example document:

```json
{
  "storeId": "greenlane-main",
  "orderId": "order_abc123",
  "customerId": "customer_abc123",
  "orderNumber": "GL-456789",
  "customerName": "Jordan Parker",
  "status": "checked_in",
  "pickupStatus": "Ready for Pickup",
  "checkedIn": true,
  "arrivalTime": "4:37:02 PM",
  "priority": 50,
  "queueDate": "2026-03-11",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

## Relationships

- `stores` is the top-level partition key for operational data.
- `staffUsers.defaultStoreId` and `staffUsers.storeIds` control which store a staff member can operate in.
- `customers.storeId` ties the customer identity/compliance record to a primary store.
- `orders.customerId` points to `customers`.
- `orders.storeId`, `products.storeId`, and `specials.storeId` make the menu and order workflow store-aware.
- `pickupQueue.orderId` points to `orders`.
- `pickupQueue.customerId` points to `customers`.

## Which Collection Should Drive Pickup?

`orders` should drive the pickup workflow.

Reason:

- pickup is order-centric, not identity-centric
- one customer can have multiple orders over time
- order status transitions are easier to model on `orders`
- queue screens and QR scans are naturally keyed by `orderId` or `orderNumber`

`customers` should continue to hold compliance and identity state, while `pickupQueue` should become a fast operational projection of `orders`.

## Incremental Migration Path

Current app behavior is mostly customer-document-driven. The safest incremental path is:

1. Keep current pages working against existing `customers` reads.
2. Start writing `storeId` everywhere.
3. Start dual-writing preorder and verification flows to both `customers` and `orders`.
4. Add `orderId` and `customerId` cross-links.
5. Later switch queue pages to read `orders` or `pickupQueue` directly.

## Current Recommendation for This App

- Preserve `customers` for existing dashboard/check-in/checkout compatibility.
- Start creating `orders` for preorder and staff-created workflow.
- Treat `pickupQueue` as the future queue driver, not an immediate hard dependency.
- Keep menu and specials constants store-aware until Firestore-backed catalog management is added.
