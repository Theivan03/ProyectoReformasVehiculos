import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarIngenieroComponent } from './gestionar-ingeniero.component';

describe('GestionarIngenieroComponent', () => {
  let component: GestionarIngenieroComponent;
  let fixture: ComponentFixture<GestionarIngenieroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarIngenieroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarIngenieroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
