TASK: Improve preorder workflow for Greenlane Verified POS

Project: Cannabis dispensary preorder and pickup system

Goals:
1. Connect orders to Firebase Firestore
2. Persist orders in database
3. Implement order lifecycle

Order Status Flow:
pending
verified
ready
completed

Customer Features:
- create preorder
- upload ID
- choose pickup date and time
- receive pickup code

Staff Features:
- dashboard order queue
- verify customer ID
- mark order ready
- checkout order

Completed Orders Page:
- pull completed orders from Firestore
- display orderId
- pickupCode
- verification status
- completedAt

Generate:
firebase.js
firestore collections
orderService.js
customerService.js
hooks for loading orders
Add a Live Pickup Queue dashboard to the staff side.

Requirements:
- Show all active orders not yet completed
- Columns: customer name, orderId, pickupCode, verification status, arrival status, wait time, order status, next action
- Add summary cards at the top:
  - Waiting Now
  - Avg Wait Time
  - Ready for Pickup
  - Verification Issues
- Support statuses:
  pending, verified, arrived, preparing, ready, completed
- Show only the next logical action button for each row
- Highlight overdue or long-wait orders
- Keep the design clean and easy for dispensary staff to use quickly
Build a Live Pickup Queue dashboard for the staff side of this Greenlane Verified dispensary preorder app.

Context:
This is a React app for cannabis dispensary preorder, ID verification, pickup, and completion workflow. We already have customer order flow, completed orders page, and order status concepts. The dashboard now needs to become operationally useful for staff.

Requirements:
1. Add a staff-facing Live Pickup Queue dashboard.
2. Show all active orders that are not completed.
3. Add summary cards at the top for:
   - Waiting Now
   - Avg Wait Time
   - Ready for Pickup
   - Verification Issues
4. Add a queue table with these columns:
   - Customer Name
   - Order ID
   - Pickup Code
   - Verification Status
   - Arrival Status
   - Wait Time
   - Order Status
   - Next Action
5. Support these statuses:
   - pending
   - verified
   - arrived
   - preparing
   - ready
   - completed
6. Show only the next logical action button for each row, such as:
   - Verify ID
   - Mark Arrived
   - Start Prep
   - Mark Ready
   - Checkout
7. Highlight overdue or long-wait orders visually.
8. Keep the UI clean, fast, and easy for dispensary staff to scan quickly.
9. Use the existing project structure and reuse existing services/hooks where possible.
10. If Firestore integration already exists, load active orders from Firestore. If not, create a clean mock/data abstraction so it can be swapped to Firestore easily later.

Implementation details:
- Add or update any needed dashboard page/components.
- Add helper logic for wait-time calculation.
- Add any needed status transition helpers.
- Keep code modular and production-friendly.
- Do not break existing completed orders flow.

Deliverables:
- Updated dashboard UI
- Queue component(s)
- Summary cards
- Status transition logic
- Any needed service or hook updates
Add a customer parking lot check-in flow to this Greenlane Verified dispensary preorder app.

Context:
This is a React app for cannabis dispensary preorder and pickup workflow. We want customers to be able to check in when they arrive so staff can see them immediately in the Live Pickup Queue.

Requirements:
1. Add a customer-facing mobile-friendly check-in page.
2. The page should allow the customer to submit:
   - pickup code
   - parking spot
   - vehicle color
   - optional note
3. Validate the pickup code before accepting check-in.
4. On successful check-in:
   - update order status to arrived
   - save arrivalTime
   - save parkingSpot
   - save vehicleColor
   - save optional note
5. Show arrived customers immediately in the staff Live Pickup Queue.
6. Add a confirmation state after successful check-in.
7. Keep the page simple and mobile-friendly.
8. Reuse existing services/hooks where possible.
9. If Firestore is available, persist the check-in there. If not, use a clean abstraction that can be connected later.

Deliverables:
- Check-in page/route
- Pickup code validation
- Order update logic
- Queue integration for arrived customers
- Mobile-friendly UI