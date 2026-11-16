-- Ejecutar manualmente en cada base existente: DataSeeder no modifica los roles ya creados.
-- Crea los permisos para gestionar el equipo de la propia tienda (Mi tienda -> Equipo) y
-- se los asigna al dueño (VendedorPrincipal) y al Administrador. El colaborador
-- (VendedorSecundario) no los recibe: solo el dueño agrega y quita colaboradores.
-- Tambien le quita al colaborador los permisos de eliminar productos y publicaciones.
-- Es transaccional y se puede ejecutar más de una vez.
BEGIN;

CREATE TEMP TABLE permisos_colaboradores (
    rol varchar(255) NOT NULL,
    action varchar(255) NOT NULL,
    resource varchar(255) NOT NULL
) ON COMMIT DROP;

INSERT INTO permisos_colaboradores (rol, action, resource)
SELECT rol.nombre, permiso.action, 'MIS_COLABORADORES'
FROM (VALUES ('vendedorprincipal'), ('administrador')) AS rol (nombre)
CROSS JOIN (VALUES ('LIST'), ('CREATE'), ('DELETE')) AS permiso (action);

INSERT INTO permiso (action, resource, created_at)
SELECT DISTINCT nuevo.action, nuevo.resource, CURRENT_TIMESTAMP
FROM permisos_colaboradores nuevo
WHERE NOT EXISTS (
    SELECT 1
    FROM permiso existente
    WHERE upper(existente.action) = nuevo.action
      AND upper(existente.resource) = nuevo.resource
      AND existente.deleted_at IS NULL
);

INSERT INTO rol_permiso (rol_id, permiso_id, created_at)
SELECT rol.id, permiso.id, CURRENT_TIMESTAMP
FROM permisos_colaboradores nuevo
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

-- El colaborador no elimina productos ni publicaciones: no se puede deshacer desde la
-- aplicacion. Los sigue creando y editando (incluidas imagenes y archivos). El backend
-- ademas exige ser el dueño, asi que volver a asignarlos desde el panel no lo habilita.
UPDATE rol_permiso
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
FROM rol, permiso
WHERE rol_permiso.rol_id = rol.id
  AND rol_permiso.permiso_id = permiso.id
  AND rol_permiso.deleted_at IS NULL
  AND lower(rol.nombre) = 'vendedorsecundario'
  AND (upper(permiso.action), upper(permiso.resource)) IN (
      ('DELETE', 'MIS_PRODUCTOS'),
      ('DELETE', 'MIS_PUBLICACIONES')
  );

COMMIT;
