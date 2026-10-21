"use client";

import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import vendedorStyles from "@/components/vendedor/vendedor.module.css";

type Props = {
  // Tienda vinculada al usuario al aprobarse su solicitud de vendedor (viene de /me).
  idTienda: number | null;
  nombreTienda: string | null;
};

export default function MiTienda({ idTienda, nombreTienda }: Props) {
  return (
    <section className={vendedorStyles.miTienda} aria-labelledby="mi-tienda-titulo">
      <h3 id="mi-tienda-titulo" className={vendedorStyles.miTiendaTitulo}>
        Mi tienda
      </h3>

      {idTienda == null ? (
        <p className={vendedorStyles.hint}>Tu usuario todavía no tiene una tienda asociada.</p>
      ) : (
        <div className={vendedorStyles.miTiendaItem}>
          <strong className={vendedorStyles.miTiendaNombre}>{nombreTienda}</strong>
          <div className={vendedorStyles.miTiendaAcciones}>
            <Link href={`/tiendas/${idTienda}`} className={styles.buttonPrimary}>
              Ver mi tienda
            </Link>
            <Link href="/mi-tienda" className={styles.buttonOutline}>
              Gestionar mi tienda
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
