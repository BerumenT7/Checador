-- =============================================
-- SP: Historial de movimientos por empleado
-- Parámetros:
--   @ClaveChofer  -> ID del empleado
--   @SoloHoy      -> 1 = solo hoy, 0 = historial completo
-- =============================================
USE [SQLSIETE];
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_HistorialEmpleado]
    @ClaveChofer  NVARCHAR(10),
    @SoloHoy      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        TipoMovimiento,
        CAST(EsPermiso AS BIT)                          AS EsPermiso,
        RegistradoPor,
        Empresa,
        CONVERT(varchar(19), FechaHora, 120)            AS FechaHora
    FROM dbo.RegistroEntradas
    WHERE ClaveChofer = @ClaveChofer
      AND (
            @SoloHoy = 0
            OR CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
          )
    ORDER BY FechaHora DESC;
END
GO

-- Índice compuesto para acelerar el SP
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_RegistroEntradas_Chofer_Fecha'
      AND object_id = OBJECT_ID('dbo.RegistroEntradas')
)
CREATE NONCLUSTERED INDEX IX_RegistroEntradas_Chofer_Fecha
ON dbo.RegistroEntradas (ClaveChofer, FechaHora DESC)
INCLUDE (TipoMovimiento, EsPermiso, RegistradoPor, Empresa);
GO

PRINT 'SP e índice creados correctamente.';
GO
