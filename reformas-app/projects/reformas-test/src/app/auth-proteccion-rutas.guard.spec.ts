import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authProteccionRutasGuard } from './auth-proteccion-rutas.guard';

describe('authProteccionRutasGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authProteccionRutasGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
