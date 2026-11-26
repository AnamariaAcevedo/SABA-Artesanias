-- Ejecutar manualmente en cada base existente: DataSeeder no modifica los roles ya creados.
-- Permite reaccionar y comentar a clientes y vendedores, y deja esos permisos editables
-- desde el panel de roles. El rol Administrador los recibe con agregar-permisos-faltantes.sql.
-- Es transaccional y se puede ejecutar más de una vez.
BEGIN;

CREATE TEMP TABLE permisos_sociales (
    action varchar(255) NOT NULL,
    resource varchar(255) NOT NULL
) ON COMMIT DROP;

INSERT INTO permisos_sociales (action, resource) VALUES
    ('CREATE', 'REACCIONES'),
    ('DELETE', 'REACCIONES'),
    ('CREATE', 'COMENTARIOS'),
    ('DELETE', 'COMENTARIOS');

INSERT INTO permiso (action, resource, created_at)
SELECT social.action, social.resource, CURRENT_TIMESTAMP
FROM permisos_sociales social
WHERE NOT EXISTS (
    SELECT 1
    FROM permiso existente
    WHERE upper(existente.action) = social.action
      AND upper(existente.resource) = social.resource
      AND existente.deleted_at IS NULL
);

INSERT INTO rol_permiso (rol_id, permiso_id, created_at)
SELECT rol.id, permiso.id, CURRENT_TIMESTAMP
FROM rol
JOIN permiso
  ON permiso.deleted_at IS NULL
JOIN permisos_sociales social
  ON upper(permiso.action) = social.action
 AND upper(permiso.resource) = social.resource
WHERE lower(rol.nombre) IN ('cliente', 'vendedorprincipal', 'vendedorsecundario')
  AND rol.deleted_at IS NULL
ON CONFLICT (rol_id, permiso_id) DO UPDATE
SET deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
