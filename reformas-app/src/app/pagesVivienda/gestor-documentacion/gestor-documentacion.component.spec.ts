import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorDocumentacionComponent } from './gestor-documentacion.component';

describe('GestorDocumentacionComponent', () => {
  let component: GestorDocumentacionComponent;
  let fixture: ComponentFixture<GestorDocumentacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorDocumentacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestorDocumentacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
