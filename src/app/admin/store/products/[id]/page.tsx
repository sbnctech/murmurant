// Copyright © 2025 Murmurant, Inc.. All rights reserved.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      type: true,
      priceCents: true,
      comparePriceCents: true,
      imageUrl: true,
      isActive: true,
      isPublic: true,
      allowsShipping: true,
      allowsPickup: true,
      trackInventory: true,
      quantity: true,
      lowStockThreshold: true,
      digitalAssetUrl: true,
      downloadLimit: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div data-test-id="admin-product-edit-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Edit Product</h1>
      <p style={{ margin: "0 0 24px 0", color: "#6b7280" }}>
        Update product details.
      </p>
      <ProductForm
        mode="edit"
        productId={product.id}
        initialData={{
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          type: product.type,
          priceCents: product.priceCents,
          comparePriceCents: product.comparePriceCents,
          imageUrl: product.imageUrl || "",
          isActive: product.isActive,
          isPublic: product.isPublic,
          allowsShipping: product.allowsShipping,
          allowsPickup: product.allowsPickup,
          trackInventory: product.trackInventory,
          quantity: product.quantity,
          lowStockThreshold: product.lowStockThreshold,
          digitalAssetUrl: product.digitalAssetUrl || "",
          downloadLimit: product.downloadLimit,
        }}
      />
    </div>
  );
}
