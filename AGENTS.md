# Greenlane Verified AI Agent Rules

This repository powers the Greenlane Verified dispensary preorder and pickup system.

## Project Goal
Greenlane speeds up dispensary pickup by allowing customers to:

1. submit preorders
2. upload ID
3. receive pickup code
4. check in for express pickup

## Order Workflow

Customer submits preorder  
→ orderStatus = pending_review  

Staff verifies ID  
→ orderStatus = approved  

Customer checks in  
→ orderStatus = checked_in  

Staff prepares order  
→ orderStatus = ready_for_pickup  

Staff completes order  
→ orderStatus = completed

## Dashboard Behavior

The staff dashboard must behave like a **live operations queue**.

Only show active orders:

- pending_review
- approved
- express_ready
- checked_in
- ready_for_pickup

Completed orders must disappear from dashboard.

## Staff Workflow

Staff should be able to:

- click customer name
- click order number

to open the order instantly.

Do not force staff to manually search again.

## Preorder Submission

After submitting preorder:

- stop loading spinner
- show confirmation message
- redirect to `/customer-status`

The UI must never stay stuck on "Submitting preorder".

## Data Source Rules

All pages must use the same order data:

- preorder submit
- customer status
- review queue
- dashboard
- scanner

Avoid duplicate state or mock data.

## Scanner Rules

Scanner must find orders by:

- pickup code
- QR code
- order number

Not by first name alone.