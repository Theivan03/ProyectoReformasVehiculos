import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriasListaComponent } from './memorias-lista.component';

describe('MemoriasListaComponent', () => {
  let component: MemoriasListaComponent;
  let fixture: ComponentFixture<MemoriasListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriasListaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
