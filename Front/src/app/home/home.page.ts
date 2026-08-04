import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DownloadFile } from '../plugins/download-file.plugin';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark,
  chevronForward,
  helpCircleOutline,
  personOutline,
  lockOpen,
  alertCircleOutline,
  reload,
  logOutOutline,
  enterOutline,
  exitOutline,
  documentOutline,
  cameraOutline,
  downloadOutline,
  closeOutline,
  imageOutline,
  refreshOutline,
  checkmarkCircle,
  searchOutline,
  chevronDownOutline,
  optionsOutline,
  sunnyOutline,
  moonOutline,
} from 'ionicons/icons';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ConnectivityService } from '../services/connectivity.service';
import { OfflineDatabaseService } from '../services/offline-database.service';
import { getStoredTheme, toggleTheme, ThemeMode } from '../paleta';

export interface Employee {
  NumEmpleado: string;
  NombreCompleto: string;
  Departamento: string;
  Puesto: string;
  Estatus: 'ACTIVE' | 'INACTIVE';
  TieneFoto: boolean;
}

export interface EntryLogItem {
  id: number;
  time: string;
  employeeId: string;
  name: string;
  department: string;
  status: 'ADMITTED' | 'DENIED';
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  registradoPor: string;
  esPermiso: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class HomePage implements OnInit, OnDestroy {
  enteredId = '';
  currentTime = '';
  currentDate = '';
  currentEmployee: Employee | null = null;
  employeeNotFound = false;
  entryLog: EntryLogItem[] = [];
  isLoading = false;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' = 'ENTRADA';
  showPhotoModal = false;
  selectedPhoto: string | null = null;
  loadingPhoto = false;
  admitError = '';
  showExitConfirm = false;
  showSuccessModal = false;
  successMessage = '';
  isOnline = true;
  pendingCount = 0;
  isOfflineMode = false;
  offlineClock = '';
  offlineError = '';
  isSlowConnection = false;
  connectionType = 'unknown';
  employeePhoto: string | null = null;
  private admitErrorTimer: ReturnType<typeof setTimeout> | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private backButtonSub: Subscription | null = null;
  private onlineSub: Subscription | null = null;
  private slowConnSub: Subscription | null = null;
  private connInfoSub: Subscription | null = null;
  showHistoryModal = false;
  historySearchId = '';
  historyEmployee: any = null;
  historyEntries: any[] = [];
  historyFullEntries: any[] = [];
  historyLoading = false;
  historyNotFound = false;
  showFullHistory = false;
  showHistoryFilter = false;
  historyFilterTipo: 'TODAS' | 'ENTRADA' | 'SALIDA' = 'TODAS';
  historyFilterOrder: 'DESC' | 'ASC' = 'DESC';
  historyFilterRegistradoPor: 'TODOS' | 'Base Siete' | 'Clouthier' = 'TODOS';
  logFilterRegistradoPor: 'TODOS' | 'Base Siete' | 'Clouthier' = 'TODOS';

  showExportFilterModal = false;
  exportLoading = false;
  exportFilterDesde = '';
  exportFilterHasta = '';
  exportFilterDepartamento = 'TODOS';
  exportFilterTipo: 'TODAS' | 'ENTRADA' | 'SALIDA' = 'TODAS';
  exportFilterRegistradoPor: 'TODOS' | 'Base Siete' | 'Clouthier' = 'TODOS';
  exportDepartamentos: string[] = [];
  private readonly EXPORT_MIN_DATE = '2026-06-22';

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private timer: ReturnType<typeof setInterval> | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private backendCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly apiUrl = environment.apiUrl;
  themeMode: ThemeMode = getStoredTheme();

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private platform: Platform,
    private zone: NgZone,
    private connectivity: ConnectivityService,
    private offlineDatabase: OfflineDatabaseService,
  ) {
    addIcons({
      shieldCheckmark,
      chevronForward,
      helpCircleOutline,
      personOutline,
      lockOpen,
      alertCircleOutline,
      reload,
      logOutOutline,
      enterOutline,
      exitOutline,
      documentOutline,
      cameraOutline,
      downloadOutline,
      closeOutline,
      imageOutline,
      refreshOutline,
      checkmarkCircle,
      searchOutline,
      chevronDownOutline,
      optionsOutline,
      sunnyOutline,
      moonOutline,
    });
  }

  onToggleTheme() {
    this.themeMode = toggleTheme(this.themeMode);
  }

  setTipo(tipo: 'ENTRADA' | 'SALIDA') {
    this.tipoMovimiento = tipo;
  }

  openHistoryModal() {
    this.showHistoryModal = true;
    this.historySearchId = '';
    this.historyEmployee = null;
    this.historyEntries = [];
    this.historyFullEntries = [];
    this.historyNotFound = false;
    this.showFullHistory = false;
    this.showHistoryFilter = false;
    this.historyFilterTipo = 'TODAS';
    this.historyFilterOrder = 'DESC';
    this.historyFilterRegistradoPor = 'TODOS';
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
  }

  searchHistory() {
    const id = this.historySearchId.trim();
    if (!id) return;
    this.historyLoading = true;
    this.historyEmployee = null;
    this.historyEntries = [];
    this.historyFullEntries = [];
    this.historyNotFound = false;
    this.showFullHistory = false;
    this.http.get<any>(`${this.apiUrl}/employees/${id}`).subscribe({
      next: (emp) => {
        this.historyEmployee = emp;
        this.http.get<any[]>(`${this.apiUrl}/entry-log/history/${id}?soloHoy=true`).subscribe({
          next: (entries) => {
            this.historyEntries = entries.map(e => ({ ...e, timeDisplay: this.formatTime(e.FechaHora) }));
            this.historyLoading = false;
          },
          error: () => { this.historyLoading = false; },
        });
      },
      error: (err) => {
        if (err.status === 404) this.historyNotFound = true;
        this.historyLoading = false;
      },
    });
  }

  loadFullHistory() {
    if (!this.historyEmployee) return;
    this.historyLoading = true;
    this.showFullHistory = true;
    const id = this.historyEmployee.NumEmpleado;
    this.http.get<any[]>(`${this.apiUrl}/entry-log/history/${id}?soloHoy=false`).subscribe({
      next: (entries) => {
        this.historyFullEntries = entries.map(e => ({
          ...e,
          timeDisplay: this.formatTime(e.FechaHora),
          dateDisplay: e.FechaHora.substring(0, 10),
        }));
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; },
    });
  }

  get filteredEntryLog(): EntryLogItem[] {
    if (this.logFilterRegistradoPor === 'TODOS') return this.entryLog;
    return this.entryLog.filter(e => e.registradoPor === this.logFilterRegistradoPor);
  }

  get historyFullEntriesFiltered(): any[] {
    let result = [...this.historyFullEntries];
    if (this.historyFilterTipo !== 'TODAS') {
      result = result.filter(e => e.TipoMovimiento === this.historyFilterTipo);
    }
    if (this.historyFilterRegistradoPor !== 'TODOS') {
      result = result.filter(e => e.RegistradoPor === this.historyFilterRegistradoPor);
    }
    if (this.historyFilterOrder === 'ASC') {
      result.reverse();
    }
    return result;
  }

  get totalEntradas(): number {
    return this.entryLog.filter(e => e.tipoMovimiento === 'ENTRADA').length;
  }
  get totalSalidas(): number {
    return this.entryLog.filter(e => e.tipoMovimiento === 'SALIDA' && !e.esPermiso).length;
  }
  get totalPermisos(): number {
    return this.entryLog.filter(e => e.esPermiso).length;
  }

  ngOnInit() {
    this.isOfflineMode = this.auth.isOfflineMode();
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
    this.refreshPendingCount();
    this.backendCheckTimer = setInterval(() => this.checkBackend(), 15000);
    if (!this.isOfflineMode) this.loadTodayLog();
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      this.zone.run(() => { this.showExitConfirm = true; });
    });
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    this.onlineSub = this.connectivity.isOnline$.subscribe(online => {
      this.zone.run(() => {
        this.isOnline = online;
        if (online) {
          if (!this.isOfflineMode) this.loadTodayLog();
          if (this.pendingCount > 0) this.syncPending();
        }
      });
    });
    this.slowConnSub = this.connectivity.isSlowConnection$.subscribe(slow => {
      this.zone.run(() => { this.isSlowConnection = slow; });
    });
    this.connInfoSub = this.connectivity.connectionInfo$.subscribe(info => {
      this.zone.run(() => { this.connectionType = info.effectiveType; });
    });
  }

  private async refreshPendingCount() {
    this.pendingCount = await this.offlineDatabase.pendingCount();
    this.zone.run(() => {});
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.backendCheckTimer) clearInterval(this.backendCheckTimer);
    if (this.backButtonSub) this.backButtonSub.unsubscribe();
    if (this.onlineSub) this.onlineSub.unsubscribe();
    if (this.slowConnSub) this.slowConnSub.unsubscribe();
    if (this.connInfoSub) this.connInfoSub.unsubscribe();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  confirmExit() {
    App.exitApp();
  }

  cancelExit() {
    this.showExitConfirm = false;
  }

  private updateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;
  }

  private formatTime(dateStr: string): string {
    const d = new Date(dateStr.replace(' ', 'T'));
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  getInitials(name: string): string {
    return name.split(' ').filter(w => w.length > 0).slice(0, 2)
      .map(w => w[0]).join('').toUpperCase();
  }

  private checkBackend() {
    if (!this.pendingCount || this.isLoading) return;
    const healthUrl = this.apiUrl.replace(/\/api\/?$/, '') + '/health';
    this.http.get(healthUrl).subscribe({
      next: () => { void this.syncPending(); },
      error: () => {},
    });
  }

  loadTodayLog() {
    if (!this.isOnline || this.isOfflineMode) return;
    this.http.get<any[]>(`${this.apiUrl}/entry-log/today?empresa=${environment.empresa}`).subscribe({
      next: (entries) => {
        this.entryLog = entries.map(e => ({
          id:             e.Id,
          time:           this.formatTime(e.FechaHora),
          employeeId:     e.ClaveChofer,
          name:           e.NombreCompleto,
          department:     e.Departamento,
          status:         e.Estatus as 'ADMITTED' | 'DENIED',
          tipoMovimiento: e.TipoMovimiento as 'ENTRADA' | 'SALIDA',
          registradoPor:  e.RegistradoPor,
          esPermiso:      !!e.EsPermiso,
        }));
      },
      error: (err) => {
        if (err.status !== 0) console.error('Error cargando log:', err);
      },
    });
  }

  pressKey(key: string) {
    if (this.enteredId.length < 5) {
      this.enteredId += key;
      this.currentEmployee = null;
      this.employeeNotFound = false;
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    }
  }

  pressBackspace() {
    this.enteredId = this.enteredId.slice(0, -1);
    this.currentEmployee = null;
    this.employeeNotFound = false;
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  pressEnter() {
    if (!this.enteredId || this.isLoading) return;
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    if (this.isOfflineMode) {
      this.currentEmployee = {
        NumEmpleado: this.enteredId,
        NombreCompleto: 'Registro offline',
        Departamento: 'Pendiente de sincronizar',
        Puesto: '',
        Estatus: 'ACTIVE',
        TieneFoto: false,
      };
      this.employeeNotFound = false;
      return;
    }
    this.searchDebounceTimer = setTimeout(() => this.doSearch(), 300);
  }

  private doSearch() {
    this.isLoading = true;
    this.currentEmployee = null;
    this.employeeNotFound = false;
    this.employeePhoto = null;

    const original = this.enteredId;
    const stripped = String(parseInt(original, 10));
    const tryFirst = (original.startsWith('0') && stripped !== original) ? stripped : original;
    const tryFallback = tryFirst !== original ? original : null;

    const cached = this.getCachedEmployee(tryFirst);
    if (cached) {
      this.setEmployee(cached, tryFirst);
      return;
    }

    this.http.get<Employee>(`${this.apiUrl}/employees/${tryFirst}`).subscribe({
      next: (employee) => {
        this.cacheEmployee(tryFirst, employee);
        this.setEmployee(employee, tryFirst);
      },
      error: () => {
        if (tryFallback) {
          this.http.get<Employee>(`${this.apiUrl}/employees/${tryFallback}`).subscribe({
            next: (employee) => {
              this.cacheEmployee(tryFallback, employee);
              this.setEmployee(employee, tryFallback);
            },
            error: () => {
              this.employeeNotFound = true;
              this.isLoading = false;
            },
          });
        } else {
          this.employeeNotFound = true;
          this.isLoading = false;
        }
      },
    });
  }

  private setEmployee(employee: Employee, id: string) {
    this.currentEmployee = employee;
    this.isLoading = false;
    if (employee.TieneFoto) {
      // En 3G carga thumbnail automáticamente; en buena conexión carga foto original
      this.loadPhoto(id, this.isSlowConnection);
    }
  }

  loadPhoto(id: string, thumbnail = false) {
    this.loadingPhoto = true;
    const endpoint = thumbnail ? `${this.apiUrl}/employees/${id}/foto/thumbnail` : `${this.apiUrl}/employees/${id}/foto`;
    this.http.get<{ foto: string }>(endpoint).subscribe({
      next: (res) => {
        this.employeePhoto = `data:image/jpeg;base64,${res.foto}`;
        this.loadingPhoto = false;
      },
      error: () => {
        this.employeePhoto = null;
        this.loadingPhoto = false;
      },
    });
  }

  private cacheEmployee(id: string, employee: Employee) {
    try {
      localStorage.setItem(`emp_${id}`, JSON.stringify({ data: employee, ts: Date.now() }));
    } catch { /* ignore */ }
  }

  private getCachedEmployee(id: string): Employee | null {
    try {
      const raw = localStorage.getItem(`emp_${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > this.CACHE_TTL) {
        localStorage.removeItem(`emp_${id}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  admitEmployee() {
    if (!this.currentEmployee || this.isLoading) return;
    if (this.isOfflineMode) {
      void this.saveOfflineEntry(this.tipoMovimiento, false);
      return;
    }
    this.isLoading = true;
    this.admitError = '';

    this.http.post<any>(`${this.apiUrl}/entry-log`, {
      numEmpleado:    this.currentEmployee.NumEmpleado,
      tipoMovimiento: this.tipoMovimiento,
      empresa:        environment.empresa,
    }).subscribe({
      next: () => {
        this.loadTodayLog();
        this.resetForm();
        this.isLoading = false;
        this.showSuccess(this.tipoMovimiento === 'ENTRADA' ? 'Entrada registrada correctamente' : 'Salida registrada correctamente');
      },
      error: (err) => {
        if (this.isRetryableError(err)) {
          void this.saveOfflineEntry(this.tipoMovimiento, false);
          return;
        }
        this.admitError = this.parseError(err);
        this.isLoading = false;
        this.autoCloseAdmitError();
      },
    });
  }

  async salidarConPermiso() {
    if (!this.currentEmployee || this.isLoading) return;
    if (this.isOfflineMode) {
      await this.saveOfflineEntry('SALIDA', true);
      return;
    }

    let fotoBase64: string | null = null;
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: false,
      });
      fotoBase64 = photo.base64String ?? null;
    } catch {
      return;
    }

    if (!fotoBase64) return;
    this.isLoading = true;
    this.admitError = '';

    this.http.post<any>(`${this.apiUrl}/entry-log`, {
      numEmpleado:    this.currentEmployee.NumEmpleado,
      tipoMovimiento: 'SALIDA',
      esPermiso:      true,
      fotoTicket:     fotoBase64,
    }).subscribe({
      next: () => {
        this.loadTodayLog();
        this.resetForm();
        this.isLoading = false;
        this.showSuccess('Salida con permiso registrada');
      },
      error: (err) => {
        if (this.isRetryableError(err)) {
          void this.saveOfflineEntry('SALIDA', true);
          return;
        }
        this.admitError = this.parseError(err);
        this.isLoading = false;
        this.autoCloseAdmitError();
      },
    });
  }

  private isRetryableError(err: any): boolean {
    return [0, 408, 429, 500, 502, 503, 504].includes(err?.status);
  }

  private getLocalDateTime(): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  private async saveOfflineEntry(tipoMovimiento: 'ENTRADA' | 'SALIDA', esPermiso: boolean) {
    if (!this.currentEmployee) return;
    this.isLoading = true;
    this.offlineError = '';
    try {
      await this.offlineDatabase.addEntry({
        numEmpleado: this.currentEmployee.NumEmpleado,
        fechaHora: this.getLocalDateTime(),
        tipoMovimiento,
        esPermiso,
        registradoPor: this.auth.getUser()?.nombreCompleto || 'Operador offline',
        empresa: environment.empresa,
      });
      await this.refreshPendingCount();
      this.showSuccess(esPermiso ? 'Salida con permiso guardada localmente' : 'Registro guardado localmente');
      this.resetForm();
    } catch {
      this.offlineError = 'No fue posible guardar el registro en la tablet.';
    } finally {
      this.isLoading = false;
    }
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.showSuccessModal = true;
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => { this.showSuccessModal = false; }, 1500);
  }

  viewPhoto(id: number) {
    this.selectedPhoto = null;
    this.loadingPhoto = true;
    this.showPhotoModal = true;
    this.http.get<{ foto: string }>(`${this.apiUrl}/entry-log/${id}/foto`).subscribe({
      next: (res) => {
        this.selectedPhoto = `data:image/jpeg;base64,${res.foto}`;
        this.loadingPhoto = false;
      },
      error: () => { this.loadingPhoto = false; },
    });
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    this.selectedPhoto = null;
  }

  private toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  get exportMaxDate(): string {
    return this.toDateInputValue(new Date());
  }

  get exportMinDate(): string {
    return this.EXPORT_MIN_DATE;
  }

  openExportFilterModal() {
    this.exportFilterDesde = this.EXPORT_MIN_DATE;
    this.exportFilterHasta = this.exportMaxDate;
    this.exportFilterDepartamento = 'TODOS';
    this.exportFilterTipo = 'TODAS';
    this.exportFilterRegistradoPor = 'TODOS';
    this.showExportFilterModal = true;

    if (this.exportDepartamentos.length === 0) {
      this.http.get<string[]>(`${this.apiUrl}/employees/meta/departamentos`).subscribe({
        next: (deps) => { this.exportDepartamentos = deps; },
        error: () => {},
      });
    }
  }

  closeExportFilterModal() {
    if (this.exportLoading) return;
    this.showExportFilterModal = false;
  }

  confirmExportPDF() {
    this.exportLoading = true;
    let url = `${this.apiUrl}/entry-log/range?desde=${this.exportFilterDesde}&hasta=${this.exportFilterHasta}&empresa=${environment.empresa}`;
    if (this.exportFilterDepartamento !== 'TODOS') {
      url += `&departamento=${encodeURIComponent(this.exportFilterDepartamento)}`;
    }
    if (this.exportFilterRegistradoPor !== 'TODOS') {
      url += `&registradoPor=${encodeURIComponent(this.exportFilterRegistradoPor)}`;
    }

    this.http.get<any[]>(url).subscribe({
      next: async (rows) => {
        let entries = rows.map(e => ({
          dateDisplay:   e.FechaHora.substring(0, 10),
          time:          this.formatTime(e.FechaHora),
          employeeId:    e.ClaveChofer,
          name:          e.NombreCompleto,
          department:    e.Departamento,
          tipoMovimiento: e.TipoMovimiento as 'ENTRADA' | 'SALIDA',
          esPermiso:     !!e.EsPermiso,
          registradoPor: e.RegistradoPor,
        }));

        if (this.exportFilterTipo !== 'TODAS') {
          entries = entries.filter(e => e.tipoMovimiento === this.exportFilterTipo);
        }

        this.exportLoading = false;
        this.showExportFilterModal = false;
        await this.generatePDF(entries);
      },
      error: () => {
        this.exportLoading = false;
      },
    });
  }

  private async generatePDF(entries: {
    dateDisplay: string; time: string; employeeId: string; name: string; department: string;
    tipoMovimiento: string; esPermiso: boolean; registradoPor: string;
  }[]) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const fechaLegible = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    doc.setFontSize(16);
    doc.setTextColor(20, 40, 70);
    doc.text('Registro de Entradas y Salidas', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Generado: ${fechaLegible}`, 14, 23);
    doc.text(`Empresa: ${environment.empresa}`, 14, 28);
    doc.text(`Periodo: ${this.exportFilterDesde} a ${this.exportFilterHasta}`, 14, 33);

    let startY = 38;
    const filtrosTxt: string[] = [];
    if (this.exportFilterDepartamento !== 'TODOS') filtrosTxt.push(`Departamento: ${this.exportFilterDepartamento}`);
    if (this.exportFilterTipo !== 'TODAS') filtrosTxt.push(`Tipo: ${this.exportFilterTipo === 'ENTRADA' ? 'Entradas' : 'Salidas'}`);
    if (this.exportFilterRegistradoPor !== 'TODOS') filtrosTxt.push(`Registrado por: ${this.exportFilterRegistradoPor}`);
    if (filtrosTxt.length) {
      doc.text(filtrosTxt.join('   |   '), 14, startY);
      startY += 5;
    }

    const head = [['Fecha', 'Hora', 'Clave', 'Nombre', 'Departamento', 'Movimiento', 'Permiso', 'Registrado Por']];
    const body = entries.map(e => [
      e.dateDisplay, e.time, e.employeeId, e.name, e.department,
      e.tipoMovimiento, e.esPermiso ? 'Sí' : 'No', e.registradoPor,
    ]);

    autoTable(doc, {
      head,
      body,
      startY,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 252] },
    });

    const fechaArchivo = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
    const fileName = `registro-acceso-${fechaArchivo}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const base64 = doc.output('datauristring').split(',')[1];
      try {
        await DownloadFile.saveToDownloads({ data: base64, fileName, mimeType: 'application/pdf' });
        this.showSuccess('PDF guardado en Descargas');
      } catch (err) {
        console.error('Error guardando en Descargas, usando compartir:', err);
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
          });
          await Share.share({
            title: 'Registro de Entradas y Salidas',
            url: result.uri,
            dialogTitle: 'Guardar o compartir PDF',
          });
        } catch (shareErr) {
          console.error('Error generando PDF:', shareErr);
        }
      }
    } else {
      doc.save(fileName);
    }
  }

  private parseError(err: any): string {
    if (err.status === 0)   return 'Sin conexión al servidor. Verifica tu red Wi-Fi.';
    if (err.status === 403) return 'Empleado inactivo — acceso denegado.';
    if (err.status === 404) return 'Empleado no encontrado en el sistema.';
    if (err.status >= 500)  return 'Error en el servidor. Contacta a Sistemas.';
    return err?.error?.message || 'Error desconocido. Intenta de nuevo.';
  }

  private autoCloseAdmitError() {
    if (this.admitErrorTimer) clearTimeout(this.admitErrorTimer);
    this.admitErrorTimer = setTimeout(() => { this.admitError = ''; }, 5000);
  }

  async syncPending() {
    if (!this.isOnline || this.isLoading) return;
    const queue = await this.offlineDatabase.getPending();
    if (!queue.length) {
      this.pendingCount = 0;
      return;
    }

    this.isLoading = true;
    this.showSuccess(`Sincronizando ${queue.length} registro(s)...`);
    for (const item of queue) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.http.post<any>(`${this.apiUrl}/entry-log`, {
            idLocal: item.idLocal,
            numEmpleado: item.numEmpleado,
            fechaHora: item.fechaHora,
            tipoMovimiento: item.tipoMovimiento,
            esPermiso: item.esPermiso,
            registradoPor: item.registradoPor,
            empresa: item.empresa,
          }).subscribe({ next: () => resolve(), error: reject });
        });
        await this.offlineDatabase.markSynced(item.idLocal);
      } catch (error: any) {
        if ([400, 403, 404].includes(error?.status)) {
          await this.offlineDatabase.markRejected(item.idLocal);
        } else {
          await this.offlineDatabase.registerAttempt(item.idLocal);
        }
      }
    }
    await this.refreshPendingCount();
    this.isLoading = false;
    if (!this.isOfflineMode) this.loadTodayLog();
  }

  private resetForm() {
    this.enteredId = '';
    this.currentEmployee = null;
    this.employeePhoto = null;
    this.loadingPhoto = false;
    this.employeeNotFound = false;
  }
}
