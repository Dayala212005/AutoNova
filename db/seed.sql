-- ==========================================
-- AUTONOVA
-- Datos de prueba
-- PostgreSQL 16
-- ==========================================

BEGIN;

-- ==========================================
-- 1. USUARIOS
-- ==========================================

INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES
(
    'Comprador Demo 1',
    'comprador1@autonova.test',
    '$2b$10$EiM0Uiyxfn3TwG8q/pnuwOFV8oVQTGV5gUfbpinJ9eJENtvAHBYEy',
    'comprador'
),
(
    'Comprador Demo 2',
    'comprador2@autonova.test',
    '$2b$10$cVwpjE2x5s/gTrbNb.ddeuqBauw5yZyMxG/0wb280giBP6cGtnUwW',
    'comprador'
),
(
    'Vendedor Demo',
    'vendedor1@autonova.test',
    '$2b$10$fuG3HLbDHeCCdMDzlFuzqOjqAWC0qpCw5iC/Fp486reSpYe9Km6ue',
    'vendedor'
),
(
    'Administrador Demo',
    'admin1@autonova.test',
    '$2b$10$Hge4mIQyWKDRtlb/tdD/g.V76Kc.TJ0.JCXnRFgpsvliAVmb/enAm',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Verificar usuarios y roles

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (VALUES
            ('comprador1@autonova.test', 'comprador'),
            ('comprador2@autonova.test', 'comprador'),
            ('vendedor1@autonova.test', 'vendedor'),
            ('admin1@autonova.test', 'admin')
        ) AS esperado(email, rol)
        LEFT JOIN usuarios u ON u.email = esperado.email
        WHERE u.id IS NULL OR u.rol <> esperado.rol
    ) THEN
        RAISE EXCEPTION 'Los usuarios de prueba no tienen los roles esperados';
    END IF;
END $$;

-- ==========================================
-- 2. PRODUCTOS
-- El stock representa las existencias
-- disponibles despues de las ventas de prueba.
-- ==========================================

INSERT INTO productos
(nombre, descripcion, precio, stock, imagen_url, vendedor_id)

SELECT
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    NULL,
    v.id

FROM usuarios v

CROSS JOIN (
    VALUES
    ('Sedan compacto', 'Automovil compacto para ciudad', 18500.00::NUMERIC, 3),
    ('SUV familiar', 'Vehiculo familiar de amplio espacio', 26900.00::NUMERIC, 2),
    ('Pickup 4x4', 'Camioneta de trabajo y aventura', 31200.00::NUMERIC, 2),
    ('Hatchback urbano', 'Automovil economico para ciudad', 14900.00::NUMERIC, 5)
) AS p(nombre, descripcion, precio, stock)

WHERE v.email = 'vendedor1@autonova.test'
AND v.rol = 'vendedor'

AND NOT EXISTS (
    SELECT 1
    FROM productos existente
    WHERE existente.vendedor_id = v.id
    AND existente.nombre = p.nombre
);

-- ==========================================
-- 3. FACTURAS
-- Los totales incluyen IVA del 13%.
-- ==========================================

-- Factura del comprador 1
-- Subtotal: 49,700.00
-- IVA:       6,461.00
-- Total:    56,161.00

INSERT INTO facturas (id, cliente_id, total)

SELECT
    '11111111-1111-4111-8111-111111111111'::UUID,
    u.id,
    56161.00

FROM usuarios u

WHERE u.email = 'comprador1@autonova.test'
AND u.rol = 'comprador'

ON CONFLICT (id) DO NOTHING;


-- Factura del comprador 2
-- Subtotal: 26,900.00
-- IVA:       3,497.00
-- Total:    30,397.00

INSERT INTO facturas (id, cliente_id, total)

SELECT
    '22222222-2222-4222-8222-222222222222'::UUID,
    u.id,
    30397.00

FROM usuarios u

WHERE u.email = 'comprador2@autonova.test'
AND u.rol = 'comprador'

ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 4. DETALLES DE FACTURAS
-- ==========================================

-- Compra del comprador 1:
-- 1 Sedan compacto
-- 1 Pickup 4x4

INSERT INTO factura_detalle
(factura_id, producto_id, cantidad, precio_unitario)

SELECT
    '11111111-1111-4111-8111-111111111111'::UUID,
    p.id,
    1,
    p.precio

FROM productos p
JOIN usuarios v ON v.id = p.vendedor_id

WHERE p.nombre = 'Sedan compacto'
AND v.email = 'vendedor1@autonova.test'

ON CONFLICT (factura_id, producto_id) DO NOTHING;


INSERT INTO factura_detalle
(factura_id, producto_id, cantidad, precio_unitario)

SELECT
    '11111111-1111-4111-8111-111111111111'::UUID,
    p.id,
    1,
    p.precio

FROM productos p
JOIN usuarios v ON v.id = p.vendedor_id

WHERE p.nombre = 'Pickup 4x4'
AND v.email = 'vendedor1@autonova.test'

ON CONFLICT (factura_id, producto_id) DO NOTHING;


-- Compra del comprador 2:
-- 1 SUV familiar

INSERT INTO factura_detalle
(factura_id, producto_id, cantidad, precio_unitario)

SELECT
    '22222222-2222-4222-8222-222222222222'::UUID,
    p.id,
    1,
    p.precio

FROM productos p
JOIN usuarios v ON v.id = p.vendedor_id

WHERE p.nombre = 'SUV familiar'
AND v.email = 'vendedor1@autonova.test'

ON CONFLICT (factura_id, producto_id) DO NOTHING;


-- ==========================================
-- FIN
-- ==========================================

COMMIT;
