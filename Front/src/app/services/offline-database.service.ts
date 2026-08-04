import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
export type OfflineMovement = 'ENTRADA' | 'SALIDA';

export interface OfflineEntry {
  idLocal: string;
  numEmpleado: string;
  fechaHora: string;
  tipoMovimiento: OfflineMovement;
  esPermiso: boolean;
  registradoPor: string;
  empresa: string;
  estado: 'PENDIENTE' | 'SINCRONIZADO' | 'RECHAZADO';
  intentos: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineDatabaseService {
  private readonly databaseName = 'checador_offline';
  private readonly fallbackKey = 'checador_offline_entries';
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private initialized: Promise<void> | null = null;

  async addEntry(entry: Omit<OfflineEntry, 'idLocal' | 'estado' | 'intentos'>): Promise<OfflineEntry> {
    await this.initialize();
    const pending: OfflineEntry = {
      ...entry,
      idLocal: this.createId(),
      estado: 'PENDIENTE',
      intentos: 0,
    };

    if (!this.db) {
      const entries = this.readFallback();
      entries.push(pending);
      this.writeFallback(entries);
      return pending;
    }

    await this.db.run(
      `INSERT INTO movimientos_offline
       (idLocal, numEmpleado, fechaHora, tipoMovimiento, esPermiso, registradoPor, empresa, estado, intentos)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', 0)`,
      [pending.idLocal, pending.numEmpleado, pending.fechaHora, pending.tipoMovimiento,
        pending.esPermiso ? 1 : 0, pending.registradoPor, pending.empresa],
    );
    return pending;
  }

  async getPending(): Promise<OfflineEntry[]> {
    await this.initialize();
    if (!this.db) return this.readFallback().filter(entry => entry.estado === 'PENDIENTE');

    const result = await this.db.query(
      `SELECT idLocal, numEmpleado, fechaHora, tipoMovimiento, esPermiso, registradoPor, empresa, estado, intentos
       FROM movimientos_offline WHERE estado = 'PENDIENTE' ORDER BY fechaHora ASC`,
    );
    return (result.values || []).map(row => this.fromRow(row));
  }

  async markSynced(idLocal: string): Promise<void> {
    await this.initialize();
    if (!this.db) {
      this.writeFallback(this.readFallback().map(entry =>
        entry.idLocal === idLocal ? { ...entry, estado: 'SINCRONIZADO' } : entry));
      return;
    }
    await this.db.run(`UPDATE movimientos_offline SET estado = 'SINCRONIZADO' WHERE idLocal = ?`, [idLocal]);
  }

  async markRejected(idLocal: string): Promise<void> {
    await this.initialize();
    if (!this.db) {
      this.writeFallback(this.readFallback().map(entry =>
        entry.idLocal === idLocal ? { ...entry, estado: 'RECHAZADO' } : entry));
      return;
    }
    await this.db.run(`UPDATE movimientos_offline SET estado = 'RECHAZADO' WHERE idLocal = ?`, [idLocal]);
  }

  async registerAttempt(idLocal: string): Promise<void> {
    await this.initialize();
    if (!this.db) {
      this.writeFallback(this.readFallback().map(entry =>
        entry.idLocal === idLocal ? { ...entry, intentos: entry.intentos + 1 } : entry));
      return;
    }
    await this.db.run(`UPDATE movimientos_offline SET intentos = intentos + 1 WHERE idLocal = ?`, [idLocal]);
  }

  async pendingCount(): Promise<number> {
    return (await this.getPending()).length;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) this.initialized = this.initializeDatabase();
    return this.initialized;
  }

  private async initializeDatabase(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      this.db = await this.sqlite.createConnection(this.databaseName, false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS movimientos_offline (
          idLocal TEXT PRIMARY KEY NOT NULL,
          numEmpleado TEXT NOT NULL,
          fechaHora TEXT NOT NULL,
          tipoMovimiento TEXT NOT NULL,
          esPermiso INTEGER NOT NULL DEFAULT 0,
          registradoPor TEXT NOT NULL,
          empresa TEXT NOT NULL,
          estado TEXT NOT NULL DEFAULT 'PENDIENTE',
          intentos INTEGER NOT NULL DEFAULT 0
        );
      `);
    } catch (error) {
      console.error('No fue posible inicializar SQLite offline:', error);
      this.db = null;
    }
  }

  private createId(): string {
    return `tablet-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private fromRow(row: Record<string, any>): OfflineEntry {
    return {
      idLocal: row['idLocal'],
      numEmpleado: row['numEmpleado'],
      fechaHora: row['fechaHora'],
      tipoMovimiento: row['tipoMovimiento'],
      esPermiso: !!row['esPermiso'],
      registradoPor: row['registradoPor'],
      empresa: row['empresa'],
      estado: row['estado'],
      intentos: Number(row['intentos'] || 0),
    };
  }

  private readFallback(): OfflineEntry[] {
    try {
      const raw = localStorage.getItem(this.fallbackKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeFallback(entries: OfflineEntry[]): void {
    localStorage.setItem(this.fallbackKey, JSON.stringify(entries));
  }
}
