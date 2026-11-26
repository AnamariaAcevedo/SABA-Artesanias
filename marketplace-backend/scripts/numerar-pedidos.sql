-- Ejecutar manualmente una vez desplegado el numero de pedido por tienda.
-- Numera los pedidos existentes de cada tienda (1, 2, 3...) segun su orden de creacion
-- y deja la columna obligatoria. Los pedidos nuevos los numera el backend al crearlos.
-- Transaccional y repetible: solo completa los pedidos que todavia no tienen numero,
-- continuando desde el mayor numero ya asignado en su tienda.
BEGIN;
LOCK TABLE pedido IN SHARE ROW EXCLUSIVE MODE;

-- Por si el backend todavia no se levanto con la entidad nueva (ddl-auto=update la crea).
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS numero integer;

WITH sin_numero AS (
    SELECT p.id,
           COALESCE((SELECT MAX(o.numero) FROM pedido o WHERE o.tienda_id = p.tienda_id), 0)
               + ROW_NUMBER() OVER (PARTITION BY p.tienda_id ORDER BY p.id) AS numero
    FROM pedido p
    WHERE p.numero IS NULL
)
UPDATE pedido p
SET numero = s.numero
FROM sin_numero s
WHERE p.id = s.id;

-- La unicidad (tienda_id, numero) la crea ddl-auto a partir de la entidad Pedido.
ALTER TABLE pedido ALTER COLUMN numero SET NOT NULL;

COMMIT;
