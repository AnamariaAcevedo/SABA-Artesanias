-- Ejecutar manualmente una vez desplegados los cambios de autorización.
-- Los roles con permisos antiguos reciben el equivalente unificado: esto amplía
-- su alcance a todas las entidades del grupo. Revisar las asignaciones antes de aplicar.
-- Transaccional y repetible. No modifica ASSIGN/REVOKE_SUBCATEGORIAS.
BEGIN;
LOCK TABLE permiso, rol_permiso IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE equivalencias ON COMMIT DROP AS
SELECT p.id AS anterior_id,
       CASE WHEN upper(p.action) = 'GET' THEN 'LIST' ELSE upper(p.action) END AS action,
       CASE WHEN upper(p.resource) IN ('PAISES','DEPARTAMENTOS','CIUDADES','BARRIOS')
                 THEN 'DIRECCIONES'
            WHEN upper(p.resource) = 'SUBCATEGORIAS'
                 AND upper(p.action) IN ('CREATE','UPDATE','DELETE') THEN 'CATEGORIAS'
            ELSE upper(p.resource) END AS resource
FROM permiso p
WHERE upper(p.action) = 'GET'
   OR (upper(p.resource) IN ('PAISES','DEPARTAMENTOS','CIUDADES','BARRIOS')
       AND upper(p.action) IN ('CREATE','UPDATE','DELETE','LIST'))
   OR (upper(p.resource) = 'SUBCATEGORIAS'
       AND upper(p.action) IN ('CREATE','UPDATE','DELETE'));

INSERT INTO permiso (action, resource, created_at)
SELECT DISTINCT e.action, e.resource, CURRENT_TIMESTAMP
FROM equivalencias e
WHERE NOT EXISTS (SELECT 1 FROM permiso p WHERE upper(p.action)=e.action
                  AND upper(p.resource)=e.resource AND p.deleted_at IS NULL);

-- Copiar solo asignaciones y permisos de origen vigentes.
INSERT INTO rol_permiso (rol_id, permiso_id, created_at)
SELECT DISTINCT rp.rol_id, destino.id, CURRENT_TIMESTAMP
FROM rol_permiso rp
JOIN equivalencias e ON e.anterior_id=rp.permiso_id
JOIN permiso anterior ON anterior.id=e.anterior_id AND anterior.deleted_at IS NULL
JOIN permiso destino ON upper(destino.action)=e.action AND upper(destino.resource)=e.resource
                      AND destino.deleted_at IS NULL
WHERE rp.deleted_at IS NULL
ON CONFLICT (rol_id, permiso_id) DO UPDATE
SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP;

DELETE FROM rol_permiso WHERE permiso_id IN (SELECT anterior_id FROM equivalencias);
DELETE FROM permiso WHERE id IN (SELECT anterior_id FROM equivalencias);
COMMIT;
