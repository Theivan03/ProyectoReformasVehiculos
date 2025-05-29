import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneradorDocumentosComponent } from './generador-documentos.component';

describe('GeneradorDocumentosComponent', () => {
  let component: GeneradorDocumentosComponent;
  let fixture: ComponentFixture<GeneradorDocumentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneradorDocumentosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneradorDocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
