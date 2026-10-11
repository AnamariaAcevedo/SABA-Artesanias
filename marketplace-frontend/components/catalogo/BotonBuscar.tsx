import styles from "@/app/home/home.module.css";

// Botón de envío de la barra de búsqueda, con ícono de lupa en vez de texto.
export default function BotonBuscar() {
  return (
    <button type="submit" className={styles.searchButton} aria-label="Buscar" title="Buscar" suppressHydrationWarning>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
