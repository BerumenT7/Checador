import { Injectable } from '@angular/core';

export interface PendingEntry {
  id: string;
  numEmpleado: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  esPermiso: boolean;
  fotoTicket: string | null;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly STORAGE_KEY = 'checador_offline_queue';

  getQueue(): PendingEntry[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  add(entry: Omit<PendingEntry, 'id' | 'timestamp'>): PendingEntry {
    const queue = this.getQueue();
    const pending: PendingEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(pending);
    this.save(queue);
    return pending;
  }

  remove(id: string) {
    const queue = this.getQueue().filter(e => e.id !== id);
    this.save(queue);
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private save(queue: PendingEntry[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }
}
