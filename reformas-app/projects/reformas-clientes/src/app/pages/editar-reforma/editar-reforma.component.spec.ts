import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarReformaComponent } from './editar-reforma.component';

describe('EditarReformaComponent', () => {
  let component: EditarReformaComponent;
  let fixture: ComponentFixture<EditarReformaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarReformaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarReformaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
