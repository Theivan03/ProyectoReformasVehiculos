import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearReformaComponent } from './crear-reforma.component';

describe('CrearReformaComponent', () => {
  let component: CrearReformaComponent;
  let fixture: ComponentFixture<CrearReformaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearReformaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearReformaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
