"use client";

import { useState } from "react";
import styles from "@/components/admin/admin.module.css";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { avisarError, confirmar } from "@/components/dialogos/Dialogos";
import { apiFetch } from "@/lib/api";

// Activar o desactivar la propia tienda (solo el dueño). Las reglas, como no poder
// desactivarla con pedidos pendientes, las valida el backend y su mensaje se muestra tal cual.
function useCambiarEstadoTienda() {
  const { sesion, actualizar } = useSesion();
  const [guardando, setGuardando] = useState(false);
  const esDueno = sesion?.vinculoTienda === "PRINCIPAL";
  const activa = sesion?.tiendaActiva !== false;

  async function cambiar(activar: boolean) {
    if (!activar) {
      const confirmado = await confirmar({
        titulo: "¿Desactivar tu tienda?",
        mensaje:
          "Tu tienda y todos sus productos dejan de verse en el catálogo y no recibís pedidos nuevos. " +
          "Los pedidos confirmados siguen su curso. Podés volver a activarla cuando quieras.",
        textoConfirmar: "Desactivar tienda",
        peligro: true,
      });
      if (!confirmado) return;
    }
    setGuardando(true);
    try {
      await apiFetch<void>(`/mi-tienda/${activar ? "activar" : "desactivar"}`, { method: "PUT" });
      await actualizar();
    } catch (cause) {
      await avisarError(
        `No se puede ${activar ? "activar" : "desactivar"} la tienda`,
        cause,
        "No pudimos cambiar el estado de la tienda.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return { esDueno, activa, guardando, cambiar };
}

// Aviso arriba de Mi tienda mientras la tienda está desactivada (lo ve todo el equipo).
export function AvisoTiendaInactiva() {
  const { esDueno, activa, guardando, cambiar } = useCambiarEstadoTienda();
  if (activa) return null;
  return (
    <div className={styles.notice} role="status">
      Tu tienda está desactivada: no aparece en el catálogo y no recibe pedidos nuevos.{" "}
      {esDueno && (
        <button type="button" className={styles.buttonPrimary} disabled={guardando} onClick={() => void cambiar(true)}>
          {guardando ? "Activando…" : "Activar tienda"}
        </button>
      )}
    </div>
  );
}

// Tarjeta en "Datos de la tienda" para que el dueño la desactive.
export function PanelEstadoTienda() {
  const { esDueno, activa, guardando, cambiar } = useCambiarEstadoTienda();
  if (!esDueno || !activa) return null;
  return (
    <div className={styles.card}>
      <h3 className={styles.sectionSubtitle}>Estado de la tienda</h3>
      <p className={miTiendaStyles.ayuda}>
        Si dejás de vender por un tiempo, podés desactivarla: deja de verse en el catálogo y no recibe pedidos
        nuevos, sin perder productos ni pedidos.
      </p>
      <button type="button" className={styles.buttonOutline} disabled={guardando} onClick={() => void cambiar(false)}>
        {guardando ? "Desactivando…" : "Desactivar tienda"}
      </button>
    </div>
  );
}
