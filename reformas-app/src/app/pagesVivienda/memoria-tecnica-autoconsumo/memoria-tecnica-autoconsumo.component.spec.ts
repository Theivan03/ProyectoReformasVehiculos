import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriaTecnicaAutoconsumoComponent } from './memoria-tecnica-autoconsumo.component';

describe('MemoriaTecnicaAutoconsumoComponent', () => {
  let component: MemoriaTecnicaAutoconsumoComponent;
  let fixture: ComponentFixture<MemoriaTecnicaAutoconsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriaTecnicaAutoconsumoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriaTecnicaAutoconsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
