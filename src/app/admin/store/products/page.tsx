// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import Link from "next/link";
import ProductsTable from "./ProductsTable";

export default function AdminProductsListPage() {
  return (
    <div data-test-id="admin-products-list-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Products</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Manage merchandise products for the store.
          </p>
        </div>
        <Link
          href="/admin/store/products/new"
          data-test-id="admin-products-new-button"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#16a34a",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          + New Product
        </Link>
      </div>

      <ProductsTable />
    </div>
  );
}
