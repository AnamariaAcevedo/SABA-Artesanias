/*
 * Íconos de línea para las categorías del catálogo. Las categorías vienen de la
 * base de datos, así que se eligen por palabra clave en el nombre; si ninguna
 * coincide se usa un ícono genérico.
 */

type Trazos = React.ReactNode;

const ICONOS: { claves: string[]; trazos: Trazos }[] = [
  {
    // Carretel de hilo
    claves: ["textil", "tejid", "hilo", "nanduti"],
    trazos: (
      <>
        <path d="M6 3h12M6 21h12" />
        <path d="M8 3v18M16 3v18" />
        <path d="M8 7l8 3M8 11l8 3M8 15l8 3" />
      </>
    ),
  },
  {
    // Vasija
    claves: ["ceram", "barro", "alfar"],
    trazos: (
      <>
        <path d="M9 3h6M10 3v3c-3 1.2-5 4-5 7.2C5 17.5 8.1 21 12 21s7-3.5 7-7.8C19 10 17 7.2 14 6V3" />
        <path d="M5.5 12.5h13" />
      </>
    ),
  },
  {
    // Bolso de cuero
    claves: ["cuero", "marroq"],
    trazos: (
      <>
        <path d="M4 9h16l-1.2 10.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z" />
        <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
        <path d="M9 13.5h6" strokeDasharray="1.5 1.5" />
      </>
    ),
  },
  {
    // Corte de tronco
    claves: ["madera", "tallad"],
    trazos: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.5" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  {
    // Martillo de orfebre
    claves: ["metal", "plata", "orfebr", "joya"],
    trazos: (
      <>
        <path d="M14 4l6 6-2.5 2.5-6-6z" />
        <path d="M12.8 8.2 4 17l3 3 8.8-8.8" />
      </>
    ),
  },
  {
    // Aguja con hilo
    claves: ["bordad", "costur"],
    trazos: (
      <>
        <path d="M19.5 4.5 7 17" />
        <ellipse cx="19" cy="5" rx="1.6" ry="0.9" transform="rotate(-45 19 5)" />
        <path d="M7 17c-2 2-4 1.5-4 0s3-2 5 0 3 4 7 3" />
      </>
    ),
  },
  {
    // Camisa
    claves: ["ropa", "vestim", "prenda"],
    trazos: (
      <>
        <path d="M9 3 4 5.5l1.5 4.5L8 9v12h8V9l2.5 1L20 5.5 15 3c-.5 1.5-1.6 2.5-3 2.5S9.5 4.5 9 3z" />
      </>
    ),
  },
  {
    // Canasta
    claves: ["cester", "canast", "fibra", "palma"],
    trazos: (
      <>
        <path d="M3 10h18l-2 10H5z" />
        <path d="M7 10a5 5 0 0 1 10 0" />
        <path d="M9 10l1 10M15 10l-1 10M4 14.5h16" />
      </>
    ),
  },
];

// Ícono para "Todas las artesanías".
const ICONO_TODAS: Trazos = (
  <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
  </>
);

// Ícono genérico: rombo con punto, como un motivo tejido.
const ICONO_GENERICO: Trazos = (
  <>
    <path d="M12 3l9 9-9 9-9-9z" />
    <circle cx="12" cy="12" r="2" />
  </>
);

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function IconoCategoria({
  nombre,
  todas = false,
  tamanio = 20,
}: {
  nombre?: string;
  todas?: boolean;
  tamanio?: number;
}) {
  let trazos = ICONO_GENERICO;

  if (todas) {
    trazos = ICONO_TODAS;
  } else if (nombre) {
    const nombreNormalizado = normalizar(nombre);
    trazos =
      ICONOS.find(({ claves }) => claves.some((clave) => nombreNormalizado.includes(clave)))
        ?.trazos ?? ICONO_GENERICO;
  }

  return (
    <svg
      width={tamanio}
      height={tamanio}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos}
    </svg>
  );
}
