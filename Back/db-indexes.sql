-- Script de optimización: índices para tablas del Checador
-- Ejecutar en SQL Server Management Studio (SSMS) o sqlcmd

USE [SQLPRUEBAS];
GO

-- Índice en RegistroEntradas.FechaHora para acelerar getTodayEntries
-- que filtra WHERE CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_RegistroEntradas_FechaHora'
    AND object_id = OBJECT_ID('dbo.RegistroEntradas')
)
CREATE NONCLUSTERED INDEX IX_RegistroEntradas_FechaHora
ON dbo.RegistroEntradas (FechaHora DESC);
GO

-- Índice en Choferes.ClaveChofer (si aún no existe como PK o índice único)
-- La mayoría de las veces ya es PRIMARY KEY, pero verificamos por si acaso
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Choferes_ClaveChofer'
    AND object_id = OBJECT_ID('dbo.Choferes')
)
CREATE NONCLUSTERED INDEX IX_Choferes_ClaveChofer
ON dbo.Choferes (ClaveChofer);
GO

PRINT 'Índices creados correctamente.';
GO
