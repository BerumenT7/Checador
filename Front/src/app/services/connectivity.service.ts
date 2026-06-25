import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

interface ConnectionInfo {
  online: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  saveData: boolean;
}

function getConnectionInfo(): ConnectionInfo {
  const conn = (navigator as any).connection;
  return {
    online: navigator.onLine,
    effectiveType: conn?.effectiveType || 'unknown',
    saveData: conn?.saveData || false,
  };
}

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private connectionSubject = new BehaviorSubject<ConnectionInfo>(getConnectionInfo());

  public isOnline$ = this.onlineSubject.asObservable();
  public connectionInfo$ = this.connectionSubject.asObservable();
  public isSlowConnection$ = this.connectionInfo$.pipe(
    map((c) => c.online && (c.effectiveType === '2g' || c.effectiveType === 'slow-2g' || c.effectiveType === '3g' || c.saveData)),
  );

  constructor() {
    window.addEventListener('online', () => {
      this.onlineSubject.next(true);
      this.connectionSubject.next(getConnectionInfo());
    });
    window.addEventListener('offline', () => {
      this.onlineSubject.next(false);
      this.connectionSubject.next(getConnectionInfo());
    });

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', () => this.connectionSubject.next(getConnectionInfo()));
    }
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  get isSlowConnection(): boolean {
    const c = this.connectionSubject.value;
    return c.online && (c.effectiveType === '2g' || c.effectiveType === 'slow-2g' || c.effectiveType === '3g' || c.saveData);
  }

  get connectionType(): string {
    return this.connectionSubject.value.effectiveType;
  }
}
