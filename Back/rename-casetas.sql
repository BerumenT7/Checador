-- =============================================
-- Renombra "Caseta 1" -> "Base Siete" y "Caseta 2" -> "Clouthier"
-- en el historial de registros ya guardados.
-- =============================================
USE [SQLSIETE];
GO

UPDATE [dbo].[RegistroEntradas]
SET RegistradoPor = 'Base Siete'
WHERE RegistradoPor = 'Caseta 1';
GO

UPDATE [dbo].[RegistroEntradas]
SET RegistradoPor = 'Clouthier'
WHERE RegistradoPor = 'Caseta 2';
GO

PRINT 'Historial actualizado: Caseta 1 -> Base Siete, Caseta 2 -> Clouthier.';
GO
