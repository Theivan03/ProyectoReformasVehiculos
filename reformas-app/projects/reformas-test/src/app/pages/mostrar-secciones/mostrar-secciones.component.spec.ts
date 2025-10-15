import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarSeccionesComponent } from './mostrar-secciones.component';

describe('MostrarSeccionesComponent', () => {
  let component: MostrarSeccionesComponent;
  let fixture: ComponentFixture<MostrarSeccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostrarSeccionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MostrarSeccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
