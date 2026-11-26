# SABA-Artesanías · Backend

API REST del marketplace, hecha con **Java 21** y **Spring Boot 4.1** sobre **PostgreSQL**.
La consume la aplicación [`marketplace-frontend`](../marketplace-frontend/README.md).

Para la visión general del proyecto ver el [README principal](../README.md).

## Tecnologías

- Spring Web MVC, Spring Data JPA (Hibernate) y Bean Validation
- Spring Security con JWT (JJWT 0.12)
- Spring Mail, para la recuperación de contraseña
- springdoc-openapi, para la documentación Swagger
- Lombok
- PostgreSQL

## Requisitos

- Java 21 (JDK)
- PostgreSQL con una base creada para el proyecto
- Maven no hace falta: se usa el wrapper `mvnw` incluido.

## Puesta en marcha

1. Crear la base de datos vacía, por ejemplo `CREATE DATABASE saba_artesanias;`.
2. Copiar la configuración de ejemplo y completarla:

   ```powershell
   copy src\main\resources\application.properties.example src\main\resources\application.properties
   ```

3. Definir la contraseña del correo (se lee de una variable de entorno):

   ```powershell
   $env:MAIL_PASSWORD = "contraseña-de-aplicacion"
   ```

4. Iniciar la API:

   ```powershell
   .\mvnw spring-boot:run
   ```

La API queda en `http://localhost:8080` y Swagger en `http://localhost:8080/swagger-ui.html`.
Para probar endpoints protegidos desde Swagger, iniciar sesión con `POST /login` y pegar el
`accessToken` en el botón **Authorize**.

### Configuración (`application.properties`)

| Propiedad | Descripción |
|---|---|
| `spring.datasource.url`, `username`, `password` | Conexión a PostgreSQL |
| `spring.jpa.hibernate.ddl-auto` | `update`: Hibernate crea y actualiza las tablas al iniciar |
| `jwt.secret.key` | Clave para firmar los JWT, de al menos 32 caracteres |
| `jwt.expiration.time` | Duración del access token, en minutos (60) |
| `jwt.refresh.expiration.time` | Duración del refresh token, en minutos (10080 = 7 días) |
| `spring.servlet.multipart.*` | Tamaño máximo de imágenes y comprobantes (5 MB por archivo) |
| `spring.mail.*` | Servidor SMTP para la recuperación de contraseña |
| `app.frontend-url` | URL del frontend, para armar el enlace de recuperación |

`application.properties` no se versiona: cada integrante tiene el suyo con sus credenciales.

## Datos iniciales

Los roles, permisos y datos de ejemplo los carga la clase `DataSeeder`, que **no se versiona**
(está en `.gitignore`). Para una base nueva hay que pedírsela al equipo y ubicarla en
`src/main/java/com/marketplace/marketplace_backend/`. Las imágenes de los productos de ejemplo
están en `src/main/resources/seed-images/`.

En `scripts/` están los scripts SQL para actualizar bases ya existentes (permisos nuevos,
numeración de pedidos, etc.). Se ejecutan a mano; cada uno explica al comienzo cuándo usarlo.
Todos son transaccionales y se pueden ejecutar más de una vez.

## Estructura

```
src/main/java/com/marketplace/marketplace_backend/
├── config/      SecurityConfig, JwtRequestFilter, JwtUtil, PasswordConfig, OpenApiConfig
├── common/      BaseEntity, StandardResponseDto, Pagination, PagedResult, ApiExceptionHandler
└── modules/     Un paquete por funcionalidad
```

Cada módulo sigue la misma estructura:

```
modules/<modulo>/
├── <Entidad>.java               Entidad JPA
├── <Entidad>Controller.java     Endpoints REST
├── <Entidad>Service.java        Interfaz con las operaciones de negocio
├── <Entidad>ServiceImpl.java    Implementación
├── <Entidad>Repository.java     Acceso a datos (Spring Data JPA)
└── dto/                         Request, Response y Filter DTOs
```

### Módulos

| Área | Módulos | Rutas base |
|---|---|---|
| Autenticación | `auth`, `refreshtoken`, `recuperacion` | `/login`, `/refresh`, `/registro`, `/recuperar` |
| Usuarios y permisos | `usuario`, `perfil`, `rol`, `permiso`, `rolpermiso` | `/usuarios`, `/perfil`, `/roles`, `/permisos` |
| Ubicaciones | `pais`, `departamento`, `ciudad`, `barrio`, `direccion`, `ubicacion` | `/paises`, `/departamentos`, `/ciudades`, `/barrios`, `/direcciones`, `/public/ubicaciones` |
| Tiendas | `tienda`, `tiendausuario`, `mitienda`, `contacto`, `tipocontacto`, `solicitudvendedor` | `/tiendas`, `/mi-tienda`, `/contactos`, `/tipos-contacto`, `/solicitudes-vendedor` |
| Catálogo | `producto`, `imagenproducto`, `categoria`, `subcategoria`, `categoriasubcategoria`, `productosubcategoria` | `/productos`, `/imagenes`, `/categorias`, `/subcategorias` |
| Publicaciones | `publicacion`, `archivopublicacion`, `comentario`, `reaccion` | `/publicaciones`, `/archivos-publicacion` |
| Ventas | `pedido`, `cupon` | `/pedidos`, `/cupones`, `/tiendas/{idTienda}/cupones` |
| Métricas | `dashboard` | `/admin/dashboard` |

`mitienda` reúne las operaciones del vendedor sobre **su propia** tienda (productos, pedidos,
cupones, contactos, colaboradores). La tienda se obtiene del usuario autenticado, nunca de un id
enviado por el cliente.

## Convenciones

### Formato de respuesta

Todos los endpoints responden con `StandardResponseDto`:

```json
{
  "success": true,
  "data": { },
  "errors": null,
  "pagination": { "page": 1, "perPage": 10, "total": 42 }
}
```

`pagination` aparece solo en los listados. Los listados reciben `page` (desde 1) y `perPage`
como parámetros de consulta.

### Errores

`ApiExceptionHandler` convierte las excepciones al mismo formato, con `success: false` y los
mensajes en `errors`:

| Excepción | Código HTTP |
|---|---|
| Validación (`@Valid`), `IllegalArgumentException` | 400 |
| Sin sesión o token inválido | 401 |
| `AccessDeniedException` (falta el permiso) | 403 |
| `EntityNotFoundException` | 404 |
| `IllegalStateException`, dato duplicado | 409 |
| Archivo demasiado grande | 413 |
| Cualquier otra | 500 |

### Seguridad

- **JWT sin sesión.** `POST /login` devuelve un `accessToken` y un `refreshToken`. El access token
  se envía en `Authorization: Bearer <token>`; el refresh token solo sirve en `POST /refresh`.
  Cada token lleva el claim `typ` (`access` o `refresh`) y el filtro rechaza los refresh tokens.
- **Permisos.** Cada rol tiene permisos con la forma `ACCION_RECURSO` (por ejemplo
  `CREATE_ROLES`). `UsuarioDetailsService` los carga como *authorities* y cada endpoint los exige
  con `@PreAuthorize("hasAuthority('...')")`.
- **Rutas públicas.** El login, registro, recuperación, Swagger y las consultas `GET` del catálogo
  (productos, tiendas, categorías, publicaciones, cupones, ubicaciones) no requieren sesión.
  También se puede crear un pedido como invitado.
- **CORS.** Solo se aceptan peticiones desde `http://localhost:3000`.

### Entidades

- Extienden `BaseEntity`, que agrega `createdAt`, `updatedAt` (auditoría de JPA) y `deletedAt`.
- El borrado es **lógico**: se completa `deletedAt` y las consultas excluyen esos registros.

## Tests

```powershell
.\mvnw test
```

La mayoría son tests unitarios de los services con Mockito y no necesitan base de datos.
`MarketplaceBackendApplicationTests` y `DashboardIntegrationTests` levantan el contexto
completo y requieren una base PostgreSQL configurada en `application.properties`.
