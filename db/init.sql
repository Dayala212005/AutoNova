-- ==========================================
-- AUTONOVA
-- Database initialization
-- PostgreSQL 16
-- ==========================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('comprador', 'vendedor', 'admin')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(180) NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    vendedor_id INTEGER NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_productos_vendedor
        FOREIGN KEY (vendedor_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- 3. INVOICES
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id INTEGER NOT NULL,
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_facturas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- 4. INVOICE DETAILS
CREATE TABLE IF NOT EXISTS factura_detalle (
    id SERIAL PRIMARY KEY,
    factura_id UUID NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL
        CHECK (precio_unitario >= 0),

    CONSTRAINT fk_detalle_factura
        FOREIGN KEY (factura_id)
        REFERENCES facturas(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_factura_producto
        UNIQUE (factura_id, producto_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_productos_vendedor
    ON productos(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_facturas_cliente_fecha
    ON facturas(cliente_id, creada_en DESC);

CREATE INDEX IF NOT EXISTS idx_detalle_factura
    ON factura_detalle(factura_id);

CREATE INDEX IF NOT EXISTS idx_detalle_producto
    ON factura_detalle(producto_id);

-- ==========================================
-- END
-- ==========================================
