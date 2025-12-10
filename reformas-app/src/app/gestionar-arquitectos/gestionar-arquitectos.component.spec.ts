import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarArquitectosComponent } from './gestionar-arquitectos.component';

describe('GestionarArquitectosComponent', () => {
  let component: GestionarArquitectosComponent;
  let fixture: ComponentFixture<GestionarArquitectosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarArquitectosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarArquitectosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
