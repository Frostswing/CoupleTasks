import assert from "assert";
import {
  autoDetectStoreDepartment,
  resolveStoreDepartment,
  groupItemsByStoreDepartment,
  sanitizeDepartmentOrder,
  DEFAULT_STORE_DEPARTMENT_ORDER,
} from "../src/constants/storeDepartments.js";

function test(name, fn) {
  fn();
  console.log(`✓ ${name}`);
}

test("Hebrew milk → dairy", () => {
  assert.strictEqual(autoDetectStoreDepartment("חלב 3%"), "dairy");
});

test("English bread → bakery", () => {
  assert.strictEqual(autoDetectStoreDepartment("Sourdough bread"), "bakery");
});

test("legacy item uses category fallback", () => {
  assert.strictEqual(
    resolveStoreDepartment({ name: "xyz123", category: "frozen" }),
    "frozen"
  );
});

test("grouping respects custom order", () => {
  const items = [
    { name: "Milk", store_department: "dairy" },
    { name: "Apple", store_department: "produce" },
  ];
  const groups = groupItemsByStoreDepartment(items, ["produce", "dairy"]);
  assert.strictEqual(groups[0].departmentId, "produce");
  assert.strictEqual(groups[1].departmentId, "dairy");
});

test("sanitize fills missing departments", () => {
  const order = sanitizeDepartmentOrder(["drinks"]);
  assert.ok(order.includes("produce"));
  assert.ok(order.includes("drinks"));
  assert.strictEqual(order[0], "drinks");
});

test("default order length", () => {
  assert.strictEqual(DEFAULT_STORE_DEPARTMENT_ORDER.length, 10);
});

console.log("All store department tests passed.");
