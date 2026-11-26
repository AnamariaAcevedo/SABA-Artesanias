// Punto de entrega elegido en el mapa. El backend no tiene campos para
// coordenadas, así que el punto viaja como un link de Google Maps al final de
// la referencia del pedido ("portón negro · Ubicación: https://...").

export type Punto = { lat: number; lng: number };

// Centro inicial del mapa: Asunción.
export const CENTRO_POR_DEFECTO: Punto = { lat: -25.2867, lng: -57.647 };

// La referencia se guarda en una columna de 255 caracteres; el link ocupa ~65.
export const LARGO_MAXIMO_REFERENCIA = 180;

const SEPARADOR = " · Ubicación: ";
const PATRON_LINK = /(?:^|\s·\s)?Ubicación:\s*(https:\/\/www\.google\.com\/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))\s*$/;

export function linkGoogleMaps({ lat, lng }: Punto): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function armarReferencia(texto: string, punto: Punto | null): string | undefined {
  const limpio = texto.trim();
  if (!punto) return limpio || undefined;
  const ubicacion = linkGoogleMaps(punto);
  return limpio ? `${limpio}${SEPARADOR}${ubicacion}` : `Ubicación: ${ubicacion}`;
}

// Separa el texto que escribió el cliente del link al mapa.
export function separarReferencia(referencia: string | null): { texto: string; linkMapa: string | null } {
  if (!referencia) return { texto: "", linkMapa: null };
  const coincidencia = referencia.match(PATRON_LINK);
  if (!coincidencia) return { texto: referencia, linkMapa: null };
  return {
    texto: referencia.slice(0, coincidencia.index).trim(),
    linkMapa: coincidencia[1],
  };
}
