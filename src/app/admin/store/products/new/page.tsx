// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div data-test-id="admin-product-new-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>New Product</h1>
      <p style={{ margin: "0 0 24px 0", color: "#6b7280" }}>
        Create a new product for the store.
      </p>
      <ProductForm mode="create" />
    </div>
  );
}
