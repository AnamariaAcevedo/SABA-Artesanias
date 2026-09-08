import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import UsuarioForm from "@/components/admin/usuarios/UsuarioForm";

export default function NuevoUsuarioPage() {
  return (
    <div>
      <Link href="/admin/usuarios" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <h2 className={styles.pageTitle}>Nuevo usuario</h2>
      <UsuarioForm modo="crear" />
    </div>
  );
}
