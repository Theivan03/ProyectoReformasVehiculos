import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarTallerComponent } from './gestionar-taller.component';

describe('GestionarTallerComponent', () => {
  let component: GestionarTallerComponent;
  let fixture: ComponentFixture<GestionarTallerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarTallerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarTallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
