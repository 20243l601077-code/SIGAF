-- =========================================================
-- SIGAF - SISTEMA DE GESTIÓN ADMINISTRATIVA Y FINANCIERA
-- SCRIPT DE BASE DE DATOS COMPLETO (PostgreSQL)
-- =========================================================

-- =========================================================
-- 1. TIPOS DE DATOS (ENUMS)
-- =========================================================
DO $$ BEGIN
    CREATE TYPE tipo_comprobante_enum AS ENUM ('FACTURA', 'TICKET', 'NOTA_VENTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE estado_venta_enum AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE estado_cotizacion_enum AS ENUM ('VIGENTE', 'VENCIDA', 'CONVERTIDA', 'RECHAZADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimiento_enum AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_producto_enum AS ENUM ('MATERIAL', 'HERRAMIENTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_egreso_enum AS ENUM ('COMPRA_INSUMOS', 'PAGO_NOMINA', 'GASTO_OPERATIVO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. TABLAS INDEPENDIENTES Y BASE (Nivel 1)
-- =========================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario     SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellidoPa     VARCHAR(80),
    apellidoMa     VARCHAR(80),
    correo         VARCHAR(100) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    rol            VARCHAR(50)  NOT NULL, 
    activo         BOOLEAN DEFAULT TRUE,
    tiempo         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cliente (
    id_cliente     SERIAL PRIMARY KEY,
    nombre         VARCHAR(100),
    razon_social   VARCHAR(150),
    rfc            VARCHAR(13),
    telefono       VARCHAR(15),
    email          VARCHAR(120),
    direccion      TEXT
);

CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor   SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    empresa        VARCHAR(100),
    razon_social   VARCHAR(150),
    rfc            VARCHAR(13) UNIQUE,
    contacto       VARCHAR(100),
    telefono       VARCHAR(20),
    email          VARCHAR(120)
);

-- =========================================================
-- 3. TABLAS DEPENDIENTES (Nivel 2)
-- =========================================================
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado        SERIAL PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    apellido_paterno  VARCHAR(80) NOT NULL,
    apellido_materno  VARCHAR(80),
    puesto            VARCHAR(100) NOT NULL,
    correo            VARCHAR(120) UNIQUE,
    telefono          VARCHAR(15),
    horas_laborales   INTEGER DEFAULT 48,
    rol               VARCHAR(50) NOT NULL,
    id_usuario        INT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS producto (
    id_producto        SERIAL PRIMARY KEY,
    codigo             VARCHAR(50) UNIQUE,
    descripcion        VARCHAR(200) NOT NULL,
    categoria          VARCHAR(80),
    tipo_producto      tipo_producto_enum NOT NULL DEFAULT 'MATERIAL',
    unidad_medida      VARCHAR(20),
    precio_unitario    NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_adquisicion  NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_actual       INTEGER NOT NULL DEFAULT 0,
    stock_minimo       INTEGER NOT NULL DEFAULT 0,
    activo             BOOLEAN DEFAULT TRUE, 
    id_proveedor       INTEGER,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE IF NOT EXISTS alerta_stock (
    id_alerta      SERIAL PRIMARY KEY,
    id_producto    INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    stock_actual   INTEGER NOT NULL,
    stock_minimo   INTEGER NOT NULL,
    mensaje        TEXT NOT NULL,
    atendida       BOOLEAN DEFAULT FALSE,
    fecha          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporte (
    id_reporte     SERIAL PRIMARY KEY,
    titulo         VARCHAR(150),
    descripcion    TEXT,
    fecha          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario     INT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================================
-- 4. TABLAS DE OPERACIONES / TRANSACCIONALES (Nivel 3)
-- =========================================================
CREATE TABLE IF NOT EXISTS venta (
    id_venta           SERIAL PRIMARY KEY,
    fecha_venta        DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_venta         TIME NOT NULL DEFAULT CURRENT_TIME,
    folio_factura      VARCHAR(50) UNIQUE, 
    subtotal           NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva                NUMERIC(12,2) NOT NULL DEFAULT 0,
    total              NUMERIC(12,2) NOT NULL DEFAULT 0,
    tipo_comprobante   tipo_comprobante_enum NOT NULL DEFAULT 'TICKET',
    estado             estado_venta_enum NOT NULL DEFAULT 'PENDIENTE',
    id_usuario         INTEGER NOT NULL, 
    id_cliente         INTEGER,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE IF NOT EXISTS cotizacion (
    id_cotizacion      SERIAL PRIMARY KEY,
    fecha_emision      TIMESTAMPTZ DEFAULT now(),
    fecha_vigencia     TIMESTAMPTZ,
    total_estimado     NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado             estado_cotizacion_enum NOT NULL DEFAULT 'VIGENTE',
    id_cliente         INTEGER,
    id_usuario         INTEGER NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS movimiento_inventario (
    id_movimiento      SERIAL PRIMARY KEY,
    tipo_movimiento    tipo_movimiento_enum NOT NULL,
    cantidad           INTEGER NOT NULL,
    motivo             TEXT,
    fecha              TIMESTAMPTZ DEFAULT now(),
    id_producto        INTEGER NOT NULL,
    id_usuario         INTEGER NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS egreso (
    id_egreso          SERIAL PRIMARY KEY,
    tipo_egreso        tipo_egreso_enum NOT NULL,
    monto              NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    descripcion        TEXT NOT NULL,
    fecha_egreso       DATE NOT NULL DEFAULT CURRENT_DATE,
    id_usuario         INTEGER NOT NULL,
    id_empleado        INTEGER, 
    id_proveedor       INTEGER, 
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE IF NOT EXISTS bitacora_acciones (
    id_bitacora        SERIAL PRIMARY KEY,
    accion             VARCHAR(100) NOT NULL,
    tabla_afectada     VARCHAR(60),
    id_registro        INTEGER,
    detalle_json       JSONB,
    fecha              TIMESTAMPTZ DEFAULT now(),
    id_usuario         INTEGER NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================================
-- 5. DETALLES DE TRANSACCIONES (Nivel 4)
-- =========================================================
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle         SERIAL PRIMARY KEY,
    cantidad           INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario    NUMERIC(12,2) NOT NULL,
    subtotal_linea     NUMERIC(12,2) NOT NULL,
    id_venta           INTEGER NOT NULL,
    id_producto        INTEGER NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE IF NOT EXISTS detalle_cotizacion (
    id_det_cotizacion  SERIAL PRIMARY KEY,
    cantidad           INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario    NUMERIC(12,2) NOT NULL,
    id_cotizacion      INTEGER NOT NULL,
    id_producto        INTEGER NOT NULL,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- =========================================================
-- 6. ÍNDICES (Optimización de búsquedas para el Frontend)
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_venta_fecha          ON venta(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_venta_cliente        ON venta(id_cliente);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta  ON detalle_venta(id_venta);
CREATE INDEX IF NOT EXISTS idx_producto_proveedor   ON producto(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_movimiento_producto  ON movimiento_inventario(id_producto);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario     ON bitacora_acciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_alerta_stock_producto ON alerta_stock(id_producto);
CREATE INDEX IF NOT EXISTS idx_egreso_fecha         ON egreso(fecha_egreso);

-- =========================================================
-- 7. VISTAS (Consumo directo desde los componentes de Angular)
-- =========================================================
CREATE OR REPLACE VIEW vw_productos_bajo_stock AS
SELECT p.id_producto, p.descripcion, p.categoria, p.tipo_producto, p.stock_actual, p.stock_minimo,
       pr.razon_social AS proveedor
FROM producto p
LEFT JOIN proveedor pr ON pr.id_proveedor = p.id_proveedor
WHERE p.stock_actual <= p.stock_minimo
  AND p.activo = TRUE;

CREATE OR REPLACE VIEW vw_resumen_ventas AS
SELECT v.id_venta, v.fecha_venta, v.hora_venta, v.folio_factura, v.total, v.estado, v.tipo_comprobante,
       u.nombre AS administrador,
       COALESCE(c.nombre, c.razon_social, 'Público General') AS cliente,
       c.rfc AS cliente_rfc
FROM venta v
JOIN usuario u ON v.id_usuario = u.id_usuario
LEFT JOIN cliente c ON v.id_cliente = c.id_cliente;

CREATE OR REPLACE VIEW vw_balance_financiero AS
SELECT 
    (SELECT COALESCE(SUM(total), 0) FROM venta WHERE estado = 'CONFIRMADA') AS total_ingresos,
    (SELECT COALESCE(SUM(monto), 0) FROM egreso) AS total_egresos,
    ((SELECT COALESCE(SUM(total), 0) FROM venta WHERE estado = 'CONFIRMADA') - 
     (SELECT COALESCE(SUM(monto), 0) FROM egreso)) AS balance_neto;

-- =========================================================
-- 8. FUNCIONES Y PROCEDIMIENTOS
-- =========================================================
CREATE OR REPLACE FUNCTION fn_alerta_stock_minimo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_actual <= NEW.stock_minimo THEN
        IF NOT EXISTS (
            SELECT 1 FROM alerta_stock
            WHERE id_producto = NEW.id_producto AND atendida = FALSE
        ) THEN
            INSERT INTO alerta_stock (id_producto, stock_actual, stock_minimo, mensaje)
            VALUES (
                NEW.id_producto,
                NEW.stock_actual,
                NEW.stock_minimo,
                'El producto "' || NEW.descripcion || '" alcanzó el stock mínimo ('
                    || NEW.stock_actual || '/' || NEW.stock_minimo || ').'
            );
        END IF;
    ELSE
        UPDATE alerta_stock
        SET atendida = TRUE
        WHERE id_producto = NEW.id_producto AND atendida = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_descontar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_disponible INTEGER;
    v_id_usuario       INTEGER;
BEGIN
    SELECT stock_actual INTO v_stock_disponible
    FROM producto WHERE id_producto = NEW.id_producto
    FOR UPDATE;

    IF v_stock_disponible IS NULL THEN
        RAISE EXCEPTION 'El producto % no existe', NEW.id_producto;
    END IF;

    IF v_stock_disponible < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto % (disponible: %, solicitado: %)',
            NEW.id_producto, v_stock_disponible, NEW.cantidad;
    END IF;

    UPDATE producto
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id_producto = NEW.id_producto;

    SELECT id_usuario INTO v_id_usuario FROM venta WHERE id_venta = NEW.id_venta;

    INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_usuario)
    VALUES ('SALIDA', NEW.cantidad,
            'Salida automática por venta #' || NEW.id_venta,
            NEW.id_producto, v_id_usuario);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_revertir_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    IF NEW.estado = 'CANCELADA' AND OLD.estado IS DISTINCT FROM 'CANCELADA' THEN
        FOR r IN
            SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = NEW.id_venta
        LOOP
            UPDATE producto
            SET stock_actual = stock_actual + r.cantidad
            WHERE id_producto = r.id_producto;

            INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_usuario)
            VALUES ('ENTRADA', r.cantidad,
                    'Reversión de stock por cancelación de venta #' || NEW.id_venta,
                    r.id_producto, NEW.id_usuario);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validar_stock_no_negativo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_actual < 0 THEN
        RAISE EXCEPTION 'El stock del producto % no puede ser negativo (intento: %)',
            NEW.id_producto, NEW.stock_actual;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_actualizar_cotizaciones_vencidas()
RETURNS INTEGER AS $$
DECLARE
    v_afectadas INTEGER;
BEGIN
    UPDATE cotizacion
    SET estado = 'VENCIDA'
    WHERE estado = 'VIGENTE'
      AND fecha_vigencia IS NOT NULL
      AND fecha_vigencia < now();

    GET DIAGNOSTICS v_afectadas = ROW_COUNT;
    RETURN v_afectadas;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario INTEGER;
    v_data    JSONB;
BEGIN
    BEGIN
        v_usuario := current_setting('app.current_user_id', true)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_usuario := NULL;
    END;

    IF v_usuario IS NULL THEN
        v_usuario := 1;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_data := to_jsonb(OLD);
        INSERT INTO bitacora_acciones (accion, tabla_afectada, id_registro, detalle_json, id_usuario)
        VALUES ('DELETE', TG_TABLE_NAME, (v_data->>TG_ARGV[0])::INTEGER, v_data, v_usuario);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_data := jsonb_build_object('antes', to_jsonb(OLD), 'despues', to_jsonb(NEW));
        INSERT INTO bitacora_acciones (accion, tabla_afectada, id_registro, detalle_json, id_usuario)
        VALUES ('UPDATE', TG_TABLE_NAME, (to_jsonb(NEW)->>TG_ARGV[0])::INTEGER, v_data, v_usuario);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_data := to_jsonb(NEW);
        INSERT INTO bitacora_acciones (accion, tabla_afectada, id_registro, detalle_json, id_usuario)
        VALUES ('INSERT', TG_TABLE_NAME, (v_data->>TG_ARGV[0])::INTEGER, v_data, v_usuario);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 9. TRIGGERS
-- =========================================================
CREATE OR REPLACE TRIGGER trg_alerta_stock_minimo
AFTER UPDATE OF stock_actual ON producto
FOR EACH ROW EXECUTE FUNCTION fn_alerta_stock_minimo();

CREATE OR REPLACE TRIGGER trg_alerta_stock_minimo_insert
AFTER INSERT ON producto
FOR EACH ROW EXECUTE FUNCTION fn_alerta_stock_minimo();

CREATE OR REPLACE TRIGGER trg_descontar_stock_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock_venta();

CREATE OR REPLACE TRIGGER trg_revertir_stock_venta
AFTER UPDATE OF estado ON venta
FOR EACH ROW EXECUTE FUNCTION fn_revertir_stock_venta();

CREATE OR REPLACE TRIGGER trg_validar_stock_no_negativo
BEFORE INSERT OR UPDATE OF stock_actual ON producto
FOR EACH ROW EXECUTE FUNCTION fn_validar_stock_no_negativo();

CREATE OR REPLACE TRIGGER trg_auditoria_producto
AFTER INSERT OR UPDATE OR DELETE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_producto');

CREATE OR REPLACE TRIGGER trg_auditoria_venta
AFTER INSERT OR UPDATE OR DELETE ON venta
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_venta');

CREATE OR REPLACE TRIGGER trg_auditoria_cliente
AFTER INSERT OR UPDATE OR DELETE ON cliente
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_cliente');

CREATE OR REPLACE TRIGGER trg_auditoria_proveedor
AFTER INSERT OR UPDATE OR DELETE ON proveedor
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_proveedor');

CREATE OR REPLACE TRIGGER trg_auditoria_empleado
AFTER INSERT OR UPDATE OR DELETE ON empleado
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_empleado');

CREATE OR REPLACE TRIGGER trg_auditoria_egreso
AFTER INSERT OR UPDATE OR DELETE ON egreso
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_egreso');

-- =========================================================
-- 10. DATOS SEMILLA SEED
-- =========================================================

CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellidoPa       VARCHAR(80),
    apellidoMa       VARCHAR(80),
    correo           VARCHAR(100) UNIQUE NOT NULL,
    password         VARCHAR(255) NOT NULL,
    rol              VARCHAR(50)  NOT NULL,
    activo           BOOLEAN DEFAULT TRUE,
    tiempo           TIMESTAMPTZ DEFAULT now()
);

INSERT INTO usuario (nombre, correo, password, rol)
VALUES ('Diego', 'Diego@sigaf.com', '1234', 'admin');