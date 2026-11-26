import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const OFICIOS = ["Ñandutí", "Cerámica", "Cuero", "Madera", "Bordados"];

export default function Home() {
    return (
        <main className={styles.page}>
            <header className={styles.topbar}>
                <Link href="/" className={styles.marca} aria-label="SABA Artesanías">
                    <span className={styles.marcaLogo}>•SABA•</span>
                    <span className={styles.marcaSub}>Artesanías</span>
                </Link>

                <nav className={styles.topbarNav} aria-label="Accesos">
                    <Link href="/tiendas" className={styles.topbarLink}>Tiendas</Link>
                    <Link href="/login" className={styles.topbarBoton}>Iniciar sesión</Link>
                </nav>
            </header>

            <section className={styles.hero}>
                <div className={styles.texto}>
                    <p className={styles.eyebrow}>Hecho a mano en Paraguay</p>

                    <h1 className={styles.titulo}>
                        Artesanías con <em>historia</em>
                    </h1>

                    <p className={styles.bajada}>
                        Piezas únicas tejidas, moldeadas y talladas por artesanos de todo el país.
                        Conocé su trabajo y llevá una parte de nuestra tradición a tu casa.
                    </p>

                    <div className={styles.acciones}>
                        <Link href="/home" className={styles.botonPrincipal}>
                            Ver catálogo
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="m13 6 6 6-6 6" />
                            </svg>
                        </Link>
                        <Link href="/solicitar-vendedor" className={styles.botonSecundario}>
                            Quiero vender
                        </Link>
                    </div>

                    <ul className={styles.oficios} aria-label="Oficios">
                        {OFICIOS.map((oficio) => (
                            <li key={oficio}>{oficio}</li>
                        ))}
                    </ul>
                </div>

                <figure className={styles.imagen}>
                    <div className={styles.arco}>
                        <Image
                            src="/home-artesanias.png"
                            alt="Encaje de ñandutí tejido a mano"
                            fill
                            priority
                            sizes="(max-width: 900px) 360px, 460px"
                        />
                    </div>
                    <figcaption className={styles.leyenda}>
                        <strong>Ñandutí</strong>
                        <span>Encaje tradicional paraguayo</span>
                    </figcaption>
                </figure>
            </section>
        </main>
    );
}
