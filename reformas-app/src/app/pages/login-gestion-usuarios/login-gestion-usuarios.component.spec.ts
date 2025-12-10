import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginGestionUsuariosComponent } from './login-gestion-usuarios.component';

describe('LoginGestionUsuariosComponent', () => {
  let component: LoginGestionUsuariosComponent;
  let fixture: ComponentFixture<LoginGestionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginGestionUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginGestionUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
