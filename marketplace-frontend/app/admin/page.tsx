import styles from "@/components/admin/admin.module.css";

export default function AdminPage() {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Dashboard administrador</h2>
      <p className={styles.pageSubtitle}>Bienvenido al panel administrativo.</p>
    </div>
  );
}
