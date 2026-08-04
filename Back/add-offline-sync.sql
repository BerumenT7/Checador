-- =============================================
-- Soporte para registros creados en modo offline
-- Ejecutar una sola vez en la base SQLSIETE.
-- =============================================
USE [SQLSIETE];
GO

IF COL_LENGTH('dbo.RegistroEntradas', 'IdLocal') IS NULL
  ALTER TABLE dbo.RegistroEntradas ADD IdLocal NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.RegistroEntradas', 'FechaSincronizacion') IS NULL
  ALTER TABLE dbo.RegistroEntradas ADD FechaSincronizacion DATETIME2 NULL;
GO

IF COL_LENGTH('dbo.RegistroEntradas', 'FueOffline') IS NULL
BEGIN
  ALTER TABLE dbo.RegistroEntradas ADD FueOffline BIT NOT NULL CONSTRAINT DF_RegistroEntradas_FueOffline DEFAULT (0);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UX_RegistroEntradas_IdLocal'
    AND object_id = OBJECT_ID('dbo.RegistroEntradas')
)
  CREATE UNIQUE NONCLUSTERED INDEX UX_RegistroEntradas_IdLocal
  ON dbo.RegistroEntradas (IdLocal)
  WHERE IdLocal IS NOT NULL;
GO

PRINT 'Columnas e índice de sincronización offline creados correctamente.';
GO
