# SABA-Artesanías

Marketplace de artesanías desarrollado como proyecto de la materia **Ingeniería de Software 2**.
Permite a los artesanos abrir su tienda, publicar productos y gestionar pedidos, y a los
clientes recorrer el catálogo, comprar (con o sin cuenta) e interactuar con las publicaciones.

## Integrantes

- Anamaría Acevedo
- Bianca Benitez
- Angela Ayala
- Sabina Medina

## Funcionalidades

**Visitantes y clientes**
- Catálogo de productos con búsqueda, filtros por categoría/subcategoría y productos destacados.
- Listado y detalle de tiendas, con sus contactos y publicaciones.
- Carrito de compras y confirmación de pedido con comprobante de pago, cupones de descuento
  y punto de entrega en el mapa. Se puede comprar como invitado.
- Registro, inicio y cierre de sesión, recuperación de contraseña por correo.
- Perfil de usuario, direcciones e historial de compras.
- Comentarios y reacciones en las publicaciones de las tiendas.
- Solicitud para convertirse en vendedor.

**Vendedores (Mi tienda)**
- Datos de la tienda, datos de cobro, activar/desactivar la tienda.
- Productos con imágenes, stock y descuentos.
- Publicaciones, cupones, contactos y equipo (colaboradores).
- Gestión de pedidos: confirmar, enviar, entregar o cancelar.
- Dashboard con métricas de la tienda.

**Administración**
- Usuarios, roles y permisos.
- Categorías y subcategorías.
- Ubicaciones (países, departamentos, ciudades y barrios).
- Solicitudes de vendedor, pedidos y dashboard general.

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Java 21, Spring Boot 4.1, Spring Security + JWT (JJWT), Spring Data JPA, Spring Mail, springdoc-openapi, Lombok |
| Base de datos | PostgreSQL |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Leaflet |

## Estructura del repositorio

```
SABA-Artesanias/
├── marketplace-backend/            API REST (Spring Boot)
│   ├── src/main/java/.../
│   │   ├── config/                 Seguridad, JWT, CORS, Swagger
│   │   ├── common/                 Entidad base, respuesta estándar, manejo de errores
│   │   └── modules/                Un paquete por funcionalidad (controller, service, repository, dto)
│   ├── src/main/resources/         application.properties.example, imágenes de ejemplo
│   └── scripts/                    Scripts SQL de actualización para bases existentes
└── marketplace-frontend/           Aplicación web (Next.js)
    ├── app/                        Rutas y páginas
    ├── components/                 Componentes por dominio
    ├── lib/                        Cliente HTTP, sesión, carrito, permisos
    ├── services/                   Llamadas a la API por recurso
    └── types/                      Tipos TypeScript de la API
```

## Arquitectura

- El frontend consume la API REST del backend. Todas las respuestas usan el mismo formato:
  `{ success, data, errors, pagination }`.
- La autenticación es sin sesión, con **JWT**: un *access token* de corta duración que se envía
  en el header `Authorization: Bearer <token>` y un *refresh token* para renovarlo.
- La autorización se basa en **roles y permisos**. Cada usuario tiene un rol (`Cliente`,
  `VendedorPrincipal`, `VendedorSecundario`, `Administrador`) y cada rol tiene permisos con la
  forma `ACCION_RECURSO` (por ejemplo `CREATE_ROLES`), que los endpoints exigen con `@PreAuthorize`.
- Las entidades tienen fechas de auditoría y **borrado lógico** (`deleted_at`).

## Documentación

| Parte | README | Contenido |
|---|---|---|
| Backend | [marketplace-backend/README.md](marketplace-backend/README.md) | Configuración, módulos y rutas, formato de respuesta, errores, seguridad, tests |
| Frontend | [marketplace-frontend/README.md](marketplace-frontend/README.md) | Variables de entorno, scripts, estructura, comunicación con la API y sesión |

La documentación interactiva de la API está en `http://localhost:8080/swagger-ui.html` con el
backend en ejecución.

## Requisitos

- Java 21 (JDK)
- Node.js 20.9 o superior y npm
- PostgreSQL
- Maven no hace falta instalarlo: el proyecto incluye el wrapper `mvnw`.

## Puesta en marcha rápida

1. Crear una base vacía en PostgreSQL, por ejemplo `CREATE DATABASE saba_artesanias;`.
2. Backend: copiar y completar la configuración, y levantar la API en `http://localhost:8080`.

   ```powershell
   cd marketplace-backend
   copy src\main\resources\application.properties.example src\main\resources\application.properties
   .\mvnw spring-boot:run
   ```

3. Frontend: en otra terminal, levantar la aplicación en `http://localhost:3000`.

   ```powershell
   cd marketplace-frontend
   copy .env.example .env.local
   npm install
   npm run dev
   ```

El detalle de cada propiedad y variable de entorno está en el README de cada parte.

## Datos iniciales

Los roles, permisos y datos de ejemplo los carga la clase `DataSeeder`, que **no se versiona**:
hay que pedírsela al equipo. Para bases ya existentes se usan los scripts SQL de
`marketplace-backend/scripts/`. Ver [Datos iniciales](marketplace-backend/README.md#datos-iniciales)
en el README del backend.

## Tests

- Backend: `.\mvnw test` dentro de `marketplace-backend`. Dos tests necesitan PostgreSQL; ver
  [Tests](marketplace-backend/README.md#tests).
- Frontend: `npm run lint` y `npm run build` dentro de `marketplace-frontend`.

## Flujo de trabajo

- `main`: versión estable.
- `develop`: integración de las funcionalidades terminadas.
- Cada tarea se desarrolla en una rama `feature/SABA-<número>_<descripcion>` creada desde
  `develop` y se integra mediante un pull request.
