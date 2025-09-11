import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalizarReformaComponent } from './finalizar-reforma.component';

describe('FinalizarReformaComponent', () => {
  let component: FinalizarReformaComponent;
  let fixture: ComponentFixture<FinalizarReformaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalizarReformaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalizarReformaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
