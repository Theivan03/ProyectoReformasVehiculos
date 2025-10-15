import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionSeccionesComponent } from './seleccion-secciones.component';

describe('SeleccionSeccionesComponent', () => {
  let component: SeleccionSeccionesComponent;
  let fixture: ComponentFixture<SeleccionSeccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionSeccionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionSeccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
