import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarInstaladoresComponent } from './gestionar-instaladores.component';

describe('GestionarInstaladoresComponent', () => {
  let component: GestionarInstaladoresComponent;
  let fixture: ComponentFixture<GestionarInstaladoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarInstaladoresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarInstaladoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
