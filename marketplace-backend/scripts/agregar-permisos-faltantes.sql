-- Ejecutar manualmente en entornos que no cargan permisos mediante DataSeeder.
-- Crea los permisos exigidos por pedidos y funcionalidades sociales, y los
-- asigna al rol Administrador. Es transaccional y se puede ejecutar más de una vez.
BEGIN;

CREATE TEMP TABLE permisos_faltantes (
    action varchar(255) NOT NULL,
    resource varchar(255) NOT NULL
) ON COMMIT DROP;

INSERT INTO permisos_faltantes (action, resource) VALUES
    ('LIST', 'PEDIDOS'),
    ('CREATE', 'ARCHIVOS_PUBLICACION'),
    ('DELETE', 'ARCHIVOS_PUBLICACION'),
    ('CREATE', 'COMENTARIOS'),
    ('DELETE', 'COMENTARIOS'),
    ('CREATE', 'REACCIONES'),
    ('DELETE', 'REACCIONES');

INSERT INTO permiso (action, resource, created_at)
SELECT faltante.action, faltante.resource, CURRENT_TIMESTAMP
FROM permisos_faltantes faltante
WHERE NOT EXISTS (
    SELECT 1
    FROM permiso existente
    WHERE upper(existente.action) = faltante.action
      AND upper(existente.resource) = faltante.resource
      AND existente.deleted_at IS NULL
);

INSERT INTO rol_permiso (rol_id, permiso_id, created_at)
SELECT administrador.id, permiso.id, CURRENT_TIMESTAMP
FROM rol administrador
JOIN permiso
  ON permiso.deleted_at IS NULL
JOIN permisos_faltantes faltante
  ON upper(permiso.action) = faltante.action
 AND upper(permiso.resource) = faltante.resource
WHERE lower(administrador.nombre) = lower('Administrador')
  AND administrador.deleted_at IS NULL
ON CONFLICT (rol_id, permiso_id) DO UPDATE
SET deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
