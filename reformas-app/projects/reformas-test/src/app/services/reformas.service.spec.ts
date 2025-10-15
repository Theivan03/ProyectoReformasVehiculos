import { TestBed } from '@angular/core/testing';

import { ReformasService } from './reformas.service';

describe('ReformasService', () => {
  let service: ReformasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReformasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
