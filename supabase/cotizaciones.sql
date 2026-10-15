-- Complemento para el esquema entregado: la aplicación registra cotizaciones,
-- pero la tabla no está incluida en los dos scripts originales.
CREATE TABLE IF NOT EXISTS "Cotizaciones" (
  "idCotizaciones" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "Cliente" VARCHAR(150) NOT NULL,
  "Correo" VARCHAR(150) NOT NULL,
  "Telefono" VARCHAR(30),
  "Productos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "Mensaje" TEXT,
  "Estado" VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  "Fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Este proyecto debe definir políticas RLS antes de habilitar RLS en esta tabla.
-- No añadas una política pública de INSERT/SELECT en producción.
