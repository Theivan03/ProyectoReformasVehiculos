import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReformasPreviasComponent } from './reformas-previas.component';

describe('ReformasPreviasComponent', () => {
  let component: ReformasPreviasComponent;
  let fixture: ComponentFixture<ReformasPreviasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReformasPreviasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReformasPreviasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
