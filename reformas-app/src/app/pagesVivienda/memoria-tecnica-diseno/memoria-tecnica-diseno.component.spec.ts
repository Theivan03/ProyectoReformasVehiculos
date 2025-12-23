import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriaTecnicaDisenoComponent } from './memoria-tecnica-diseno.component';

describe('MemoriaTecnicaDisenoComponent', () => {
  let component: MemoriaTecnicaDisenoComponent;
  let fixture: ComponentFixture<MemoriaTecnicaDisenoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriaTecnicaDisenoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriaTecnicaDisenoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
