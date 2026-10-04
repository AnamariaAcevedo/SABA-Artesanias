import Link from "next/link";
import styles from "@/app/home/home.module.css";

// Botón con ícono de casa para volver al catálogo (/home). Va en la esquina
// superior izquierda del header, antes del logo.
export default function BotonInicio() {
  return (
    <Link href="/home" className={styles.homeButton} aria-label="Volver al catálogo" title="Volver al catálogo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
