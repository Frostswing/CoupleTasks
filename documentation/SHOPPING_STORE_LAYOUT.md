# Shopping list — store aisle layout

Linked from [ARCHITECTURE.md](./ARCHITECTURE.md).

## Overview

Shopping list items can be grouped by **store department** (produce, bakery, dairy, etc.) in a **household-defined walking order**, so couples can shop aisle-by-aisle.

## Data (additive only)

| Field / path | Description |
|--------------|-------------|
| `shopping_list_items/{id}/store_department` | Optional string id (`produce`, `bakery`, …). Omitted on legacy items → inferred at read time. |
| `{user or shared}/preferences/shopping_department_order` | String array of department ids; shared when partners use a shared space. |

Existing fields (`category`, `name`, etc.) are unchanged.

## Resolution order

1. `store_department` on the item (if set)
2. Keyword match on item name (Hebrew + English) — `src/constants/storeDepartments.js`
3. Map legacy product `category` to a department
4. `other`

## Code

- Constants & keywords: `src/constants/storeDepartments.js`
- Order persistence: `src/services/shoppingDepartmentOrderService.js`
- UI: `ShoppingListScreen`, `ShoppingModeScreen`, `StoreDepartmentPicker`, `ShoppingDepartmentOrderModal`
