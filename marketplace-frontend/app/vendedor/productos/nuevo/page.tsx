import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import ProductoForm from "@/components/vendedor/ProductoForm";

export default function NuevoProductoPage() {
  return (
    <div>
      <Link href="/vendedor/productos" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <h2 className={styles.pageTitle}>Nuevo producto</h2>
      <ProductoForm modo="crear" />
    </div>
  );
}
