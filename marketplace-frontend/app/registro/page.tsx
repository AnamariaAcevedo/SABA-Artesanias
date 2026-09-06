import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import styles from "@/components/auth/auth.module.css";
import UbicacionFields from "@/components/auth/UbicacionFields";

export default function RegistroPage() {
  return (
    <AuthShell title="Crear una cuenta" wide>
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}><label htmlFor="nombre">Nombre:</label><input id="nombre" autoComplete="given-name" /></div>
          <div className={styles.field}><label htmlFor="apellido">Apellido:</label><input id="apellido" autoComplete="family-name" /></div>
        </div>
        <div className={styles.field}><label htmlFor="nuevo-usuario">Nombre de usuario:</label><input id="nuevo-usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} /></div>
        <div className={styles.field}><label htmlFor="nueva-contrasenha">Contraseña:</label><input id="nueva-contrasenha" type="password" autoComplete="new-password" /></div>
        <div className={styles.field}><label htmlFor="confirmar">Confirmar contraseña:</label><input id="confirmar" type="password" autoComplete="new-password" /></div>
        <div className={styles.address}>
          <div className={styles.field}><label htmlFor="ubicacion">Ubicación:</label><select id="ubicacion" disabled defaultValue=""><option value="">No disponible</option></select></div>
          <div className={styles.field}><label htmlFor="calle">Calle:</label><input id="calle" autoComplete="address-line1" /></div>
          <div className={styles.field}><label htmlFor="casa">Nro. de casa:</label><input id="casa" type="text" /></div>
        </div>
        <button type="button" className={styles.submit} disabled aria-describedby="registro-notice">Crear cuenta</button>
      </div>
      <p id="registro-notice" className={styles.notice}>El registro todavía no está disponible. Este formulario no guarda tus datos.</p>
      <p className={styles.linkText}>¿Ya tenés cuenta? <Link href="/login">Iniciá sesión.</Link></p>
    </AuthShell>
  );
}
