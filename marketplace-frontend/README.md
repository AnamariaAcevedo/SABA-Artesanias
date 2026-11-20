# SABA-Artesanías · Frontend

Aplicación web del marketplace, hecha con **Next.js 16**, **React 19**, **TypeScript**,
**Tailwind CSS 4** y **Leaflet** (mapa del punto de entrega). Consume la API REST de
[`marketplace-backend`](../marketplace-backend/README.md).

Para la visión general del proyecto ver el [README principal](../README.md).

## Requisitos

- Node.js 20.9 o superior y npm.
- El backend corriendo (por defecto en `http://localhost:8080`).

## Puesta en marcha

```powershell
copy .env.example .env.local
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend | `http://localhost:8080` (solo en desarrollo) |

En producción la variable es obligatoria: sin ella el cliente HTTP informa que el servidor no
está disponible.

> El backend solo acepta peticiones (CORS) desde `http://localhost:3000`. Si el frontend corre
> en otro puerto o dominio, hay que agregarlo en `SecurityConfig` del backend.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | Revisa el código con ESLint |

## Estructura

```
app/                  Rutas (App Router). Cada carpeta es una URL.
  home/, productos/, tiendas/, cupones/    Catálogo público
  carrito/confirmar/                       Confirmación del pedido
  login/, registro/, recuperar/            Autenticación
  perfil/, usuario/, solicitar-vendedor/   Cuenta del usuario
  mi-tienda/                               Panel del vendedor (productos, pedidos, cupones, equipo...)
  admin/                                   Panel de administración (usuarios, roles, categorías...)
components/           Componentes agrupados por dominio (auth, catalogo, carrito, pedidos, mi-tienda...)
lib/                  Lógica compartida sin interfaz
services/             Funciones que llaman a la API, una por recurso
types/                Tipos TypeScript de las respuestas de la API
```

### Módulos de `lib/`

| Archivo | Responsabilidad |
|---|---|
| `api.ts` | Cliente HTTP: arma la URL, agrega el token, renueva la sesión y normaliza los errores |
| `auth.ts`, `logout.ts` | Estado de la sesión e inicio/cierre de sesión |
| `access.ts`, `permisos.ts`, `capacidades.ts` | Permisos que exige cada pantalla o acción |
| `carrito.ts` | Carrito guardado en `localStorage`, separado por usuario y sincronizado entre pestañas |
| `pedidos.ts` | Estados del pedido y transiciones permitidas |
| `mapa.ts` | Punto de entrega, que se guarda como un link de Google Maps en la referencia del pedido |
| `ubicaciones.ts` | Jerarquía País → Departamento → Ciudad → Barrio |
| `dashboard.ts` | Utilidades de los dashboards |

## Comunicación con el backend

Todas las llamadas pasan por `lib/api.ts`:

- `apiFetch<T>(path, init)`: devuelve `data` de la respuesta.
- `apiFetchConPaginacion<T>(path, init)`: devuelve `data` y `pagination`, para listados.
- `apiFetchArchivo(path)`: descarga un archivo privado (por ejemplo, un comprobante) como `Blob`.

El backend responde siempre con el formato `{ success, data, errors, pagination }`. Si
`success` es `false`, el cliente lanza un `ApiError` con el mensaje del backend y el código HTTP.

### Sesión

- Al iniciar sesión se guardan el `accessToken` y el `refreshToken` en `localStorage`.
- Cada petición envía `Authorization: Bearer <accessToken>`.
- Si el backend responde `401`, el cliente pide un token nuevo a `/refresh` una sola vez
  (aunque haya varias peticiones a la vez) y reintenta. Si la renovación falla, borra la sesión.
- `SesionProvider` expone el usuario actual y sus permisos a toda la aplicación.

### Permisos en la interfaz

Lo que ve cada usuario depende de sus **permisos**, no del nombre de su rol. El componente
`ConPermiso` y las listas de `lib/access.ts` ocultan las pantallas y botones para los que el
usuario no tiene permiso. Esto es solo visual: el backend vuelve a validar cada permiso.

## Convenciones

- Estilos con CSS Modules (`*.module.css`) junto al componente y Tailwind para utilidades.
- Componentes en `PascalCase.tsx`; textos de la interfaz en español.
- Las llamadas a la API usan siempre `lib/api.ts`, preferentemente a través de `services/`.
