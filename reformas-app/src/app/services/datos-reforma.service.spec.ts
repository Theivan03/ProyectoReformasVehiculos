import { TestBed } from '@angular/core/testing';

import { DatosReformaService } from './datos-reforma.service';

describe('DatosReformaService', () => {
  let service: DatosReformaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatosReformaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
