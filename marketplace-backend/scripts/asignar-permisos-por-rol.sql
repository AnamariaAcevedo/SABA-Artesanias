-- Ejecutar manualmente en cada base existente, ANTES de usar esta version del backend:
-- sin estos permisos los vendedores y clientes pierden el acceso a sus pantallas.
--
-- Crea los permisos sobre los datos propios (mi tienda, mis compras, mi solicitud), los
-- asigna a cada rol y les quita a los vendedores los permisos globales de administracion,
-- que actuan sobre los datos de todas las tiendas.
--
-- Es transaccional y se puede ejecutar mas de una vez, pero cada ejecucion vuelve a dejar
-- estos permisos en sus valores iniciales: pisa lo que se haya cambiado desde el panel de roles.
BEGIN;

CREATE TEMP TABLE permisos_por_rol (
    rol varchar(255) NOT NULL,
    action varchar(255) NOT NULL,
    resource varchar(255) NOT NULL
) ON COMMIT DROP;

-- Lo que hace cada vendedor en su tienda. El colaborador no edita los datos de la
-- tienda ni sus contactos, y solo consulta los cupones.
INSERT INTO permisos_por_rol (rol, action, resource)
SELECT 'vendedorprincipal', permiso.action, permiso.resource
FROM (VALUES
    ('LIST', 'MI_TIENDA'), ('UPDATE', 'MI_TIENDA'),
    ('LIST', 'MIS_CONTACTOS'), ('CREATE', 'MIS_CONTACTOS'), ('UPDATE', 'MIS_CONTACTOS'), ('DELETE', 'MIS_CONTACTOS'),
    ('CREATE', 'MIS_CUPONES'), ('DELETE', 'MIS_CUPONES')
) AS permiso (action, resource);

INSERT INTO permisos_por_rol (rol, action, resource)
SELECT rol.nombre, permiso.action, permiso.resource
FROM (VALUES ('vendedorprincipal'), ('vendedorsecundario')) AS rol (nombre)
CROSS JOIN (VALUES
    ('LIST', 'MIS_PRODUCTOS'), ('CREATE', 'MIS_PRODUCTOS'), ('UPDATE', 'MIS_PRODUCTOS'), ('DELETE', 'MIS_PRODUCTOS'),
    ('LIST', 'PEDIDOS_TIENDA'), ('UPDATE', 'PEDIDOS_TIENDA'),
    ('LIST', 'MIS_CUPONES'),
    ('LIST', 'MIS_PUBLICACIONES'), ('CREATE', 'MIS_PUBLICACIONES'), ('UPDATE', 'MIS_PUBLICACIONES'), ('DELETE', 'MIS_PUBLICACIONES'),
    ('DELETE', 'COMENTARIOS_TIENDA')
) AS permiso (action, resource);

-- Comprar y consultar las compras propias.
INSERT INTO permisos_por_rol (rol, action, resource)
SELECT rol.nombre, permiso.action, permiso.resource
FROM (VALUES ('cliente'), ('vendedorprincipal'), ('vendedorsecundario')) AS rol (nombre)
CROSS JOIN (VALUES
    ('CREATE', 'MIS_COMPRAS'), ('LIST', 'MIS_COMPRAS'), ('UPDATE', 'MIS_COMPRAS')
) AS permiso (action, resource);

-- Pedir ser vendedor: quien ya tiene una tienda no lo necesita.
INSERT INTO permisos_por_rol (rol, action, resource)
SELECT 'cliente', permiso.action, permiso.resource
FROM (VALUES
    ('CREATE', 'MI_SOLICITUD'), ('LIST', 'MI_SOLICITUD'), ('DELETE', 'MI_SOLICITUD')
) AS permiso (action, resource);

-- El administrador tiene todos, como con el resto de los permisos.
INSERT INTO permisos_por_rol (rol, action, resource)
SELECT DISTINCT 'administrador', action, resource
FROM permisos_por_rol;

INSERT INTO permiso (action, resource, created_at)
SELECT DISTINCT nuevo.action, nuevo.resource, CURRENT_TIMESTAMP
FROM permisos_por_rol nuevo
WHERE NOT EXISTS (
    SELECT 1
    FROM permiso existente
    WHERE upper(existente.action) = nuevo.action
      AND upper(existente.resource) = nuevo.resource
      AND existente.deleted_at IS NULL
);

INSERT INTO rol_permiso (rol_id, permiso_id, created_at)
SELECT rol.id, permiso.id, CURRENT_TIMESTAMP
FROM permisos_por_rol nuevo
JOIN rol
  ON lower(rol.nombre) = nuevo.rol
 AND rol.deleted_at IS NULL
JOIN permiso
  ON upper(permiso.action) = nuevo.action
 AND upper(permiso.resource) = nuevo.resource
 AND permiso.deleted_at IS NULL
ON CONFLICT (rol_id, permiso_id) DO UPDATE
SET deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

-- Permisos globales: esos endpoints no verifican a que tienda pertenece el dato, asi que
-- un vendedor con ellos podria modificar otras tiendas o ver los pedidos de todas.
UPDATE rol_permiso
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
FROM rol, permiso
WHERE rol_permiso.rol_id = rol.id
  AND rol_permiso.permiso_id = permiso.id
  AND rol_permiso.deleted_at IS NULL
  AND lower(rol.nombre) IN ('vendedorprincipal', 'vendedorsecundario')
  AND (upper(permiso.action), upper(permiso.resource)) IN (
      ('CREATE', 'PRODUCTOS'), ('UPDATE', 'PRODUCTOS'), ('DELETE', 'PRODUCTOS'),
      ('UPDATE', 'TIENDAS'),
      ('CREATE', 'IMAGENES'), ('DELETE', 'IMAGENES'),
      ('CREATE', 'ARCHIVOS_PUBLICACION'), ('DELETE', 'ARCHIVOS_PUBLICACION'),
      ('LIST', 'PEDIDOS')
  );

COMMIT;
