import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';

import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), { provide: LOCALE_ID, useValue: 'es' }],
});
