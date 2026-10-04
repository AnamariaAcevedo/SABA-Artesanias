"use client";

import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import ProductoForm from "@/components/mi-tienda/ProductoForm";

export default function NuevoProductoPage() {
  return (
    <div>
      <Link href="/mi-tienda" className={styles.backLink}>
        ← Volver a mis productos
      </Link>
      <h2 className={styles.pageTitle}>Nuevo producto</h2>
      <ProductoForm modo="crear" />
    </div>
  );
}
