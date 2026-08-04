import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { initTheme } from './paleta';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}

  async ngOnInit() {
    initTheme();
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (err) {
      console.error('Error al bloquear orientación:', err);
    }
  }
}
