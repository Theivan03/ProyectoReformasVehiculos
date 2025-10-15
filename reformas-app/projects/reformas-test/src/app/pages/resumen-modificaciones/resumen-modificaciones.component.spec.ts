import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenModificacionesComponent } from './resumen-modificaciones.component';

describe('ResumenModificacionesComponent', () => {
  let component: ResumenModificacionesComponent;
  let fixture: ComponentFixture<ResumenModificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenModificacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenModificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
