"use client";

import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import PublicacionForm from "@/components/mi-tienda/PublicacionForm";

export default function NuevaPublicacionPage() {
  return (
    <div>
      <Link href="/mi-tienda/publicaciones" className={styles.backLink}>
        ← Volver a mis publicaciones
      </Link>
      <h2 className={styles.pageTitle}>Nueva publicación</h2>
      <PublicacionForm modo="crear" />
    </div>
  );
}
