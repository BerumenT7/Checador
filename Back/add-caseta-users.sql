-- =============================================
-- Cuentas virtuales de caseta (no ligadas a un empleado real)
-- Login: ClaveChoferLink = 12000 / 12001, Password = SieteEntradas
-- =============================================
USE [SQLSIETE];
GO

INSERT INTO [auth].[UsuariosHRMS] (ClaveChoferLink, PasswordHash, RolApp, Activo)
VALUES
    ('12000', 'SieteEntradas', 'CASETA', 1),
    ('12001', 'SieteEntradas', 'CASETA', 1);
GO

PRINT 'Usuarios Caseta 1 y Caseta 2 creados correctamente.';
GO
