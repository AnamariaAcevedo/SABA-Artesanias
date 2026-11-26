"use client";

import "leaflet/dist/leaflet.css";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { CENTRO_POR_DEFECTO, linkGoogleMaps, type Punto } from "@/lib/mapa";
import styles from "./mapa.module.css";

// Mapa de OpenStreetMap (Leaflet) para marcar el punto exacto de entrega:
// un clic pone el pin, que después se puede arrastrar. Leaflet usa `window`,
// por eso se importa recién en el navegador.
export default function SelectorPuntoEntrega({
  punto,
  alCambiar,
}: {
  punto: Punto | null;
  alCambiar: (punto: Punto | null) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const pin = useRef<Marker | null>(null);
  const avisarCambio = useRef(alCambiar);
  const [listo, setListo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    avisarCambio.current = alCambiar;
  });

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      const L = (await import("leaflet")).default;
      if (cancelado || !contenedor.current) return;

      const instancia = L.map(contenedor.current, { scrollWheelZoom: false }).setView(
        [CENTRO_POR_DEFECTO.lat, CENTRO_POR_DEFECTO.lng],
        12
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instancia);

      const icono = L.divIcon({ className: styles.pin, iconSize: [30, 30], iconAnchor: [15, 36] });
      const marcador = L.marker([CENTRO_POR_DEFECTO.lat, CENTRO_POR_DEFECTO.lng], {
        icon: icono,
        draggable: true,
        keyboard: true,
        title: "Punto de entrega",
      });
      marcador.on("dragend", () => {
        const { lat, lng } = marcador.getLatLng();
        avisarCambio.current({ lat, lng });
      });
      instancia.on("click", (evento) => {
        avisarCambio.current({ lat: evento.latlng.lat, lng: evento.latlng.lng });
      });

      mapa.current = instancia;
      pin.current = marcador;
      setListo(true);
    }

    void iniciar();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      pin.current = null;
    };
  }, []);

  // Sincroniza el pin con el punto elegido.
  useEffect(() => {
    const instancia = mapa.current;
    const marcador = pin.current;
    if (!listo || !instancia || !marcador) return;
    if (punto) {
      marcador.setLatLng([punto.lat, punto.lng]);
      if (!instancia.hasLayer(marcador)) marcador.addTo(instancia);
    } else {
      marcador.remove();
    }
  }, [punto, listo]);

  function usarMiUbicacion() {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite compartir la ubicación.");
      return;
    }
    setBuscando(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nuevo = { lat: coords.latitude, lng: coords.longitude };
        alCambiar(nuevo);
        mapa.current?.setView([nuevo.lat, nuevo.lng], 17);
        setBuscando(false);
      },
      (causa) => {
        setError(
          causa.code === causa.PERMISSION_DENIED
            ? "No diste permiso para usar tu ubicación. Podés marcarla tocando el mapa."
            : "No pudimos obtener tu ubicación. Podés marcarla tocando el mapa."
        );
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className={styles.selector}>
      <span>Punto exacto en el mapa (opcional)</span>
      <p className={styles.ayuda}>
        Tocá el mapa para marcar dónde entregamos; después podés arrastrar el pin. La tienda lo va a ver en Google Maps.
      </p>
      <div ref={contenedor} className={styles.mapa} role="application" aria-label="Mapa para elegir el punto de entrega" />
      <div className={styles.acciones}>
        <button type="button" className={styles.accion} onClick={usarMiUbicacion} disabled={!listo || buscando}>
          {buscando ? "Buscando tu ubicación…" : "Usar mi ubicación actual"}
        </button>
        {punto && (
          <>
            <a className={styles.accion} href={linkGoogleMaps(punto)} target="_blank" rel="noreferrer">
              Ver en Google Maps
            </a>
            <button type="button" className={styles.accion} onClick={() => alCambiar(null)}>
              Quitar punto
            </button>
            <span className={styles.estado} role="status">Punto marcado ✓</span>
          </>
        )}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
