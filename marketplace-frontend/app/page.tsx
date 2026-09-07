import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
    return (
        <main className={styles.page}>
            <section className={styles.home}>

                <aside className={styles.brand}>
                    <div className={styles.logo}>
                        <span className={styles.dot}>•</span>
                        SABA
                        <span className={styles.dot}>•</span>
                    </div>

                    <span className={styles.artesanias}>
            Artesanías
          </span>
                </aside>

                <section className={styles.hero}>
                    <div className={styles.actions}>

                        <Link
                            href="/home"
                            className={styles.button}
                        >
                            Ver Catálogo
                        </Link>

                        <Link
                            href="/login"
                            className={styles.button}
                        >
                            Iniciar sesión
                        </Link>

                    </div>
                </section>

            </section>
        </main>
    );
}