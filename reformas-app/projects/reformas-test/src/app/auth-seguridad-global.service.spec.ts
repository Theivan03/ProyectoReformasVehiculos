import { TestBed } from '@angular/core/testing';

import { AuthSeguridadGlobalService } from './auth-seguridad-global.service';

describe('AuthSeguridadGlobalService', () => {
  let service: AuthSeguridadGlobalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSeguridadGlobalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
