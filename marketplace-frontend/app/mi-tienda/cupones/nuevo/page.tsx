"use client";

import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import CuponForm from "@/components/mi-tienda/CuponForm";

export default function NuevoCuponPage() {
  return (
    <div>
      <Link href="/mi-tienda/cupones" className={styles.backLink}>
        ← Volver a cupones
      </Link>
      <h2 className={styles.pageTitle}>Nuevo cupón</h2>
      <CuponForm />
    </div>
  );
}
