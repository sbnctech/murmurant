// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { Suspense } from "react";
import OrdersTable from "./OrdersTable";

export const metadata = {
  title: "Store Orders | Admin",
};

export default function AdminOrdersPage() {
  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
          Store Orders
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>
          Manage customer orders and fulfillment
        </p>
      </div>

      <Suspense fallback={<div>Loading orders...</div>}>
        <OrdersTable />
      </Suspense>
    </div>
  );
}
