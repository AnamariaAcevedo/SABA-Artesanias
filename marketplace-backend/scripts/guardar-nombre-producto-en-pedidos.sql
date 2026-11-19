-- Ejecutar manualmente en cada base existente.
-- Guarda en cada linea de pedido el nombre del producto al momento del pedido, para que
-- los pedidos se sigan viendo aunque el producto se elimine despues (como ya pasa con
-- el precio). Toma el nombre actual del producto, incluso de los ya eliminados.
-- Es transaccional y se puede ejecutar mas de una vez.
BEGIN;

ALTER TABLE producto_pedido ADD COLUMN IF NOT EXISTS nombre_producto varchar(255);

UPDATE producto_pedido linea
SET nombre_producto = producto.nombre
FROM producto
WHERE producto.id = linea.producto_id
  AND linea.nombre_producto IS NULL;

-- Queda nullable a proposito: asi una rama que todavia no guarda el nombre puede seguir
-- creando pedidos en esta misma base. El backend nuevo siempre la completa.

COMMIT;
