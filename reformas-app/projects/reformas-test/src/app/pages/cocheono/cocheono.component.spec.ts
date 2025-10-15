import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CocheonoComponent } from './cocheono.component';

describe('CocheonoComponent', () => {
  let component: CocheonoComponent;
  let fixture: ComponentFixture<CocheonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocheonoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CocheonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
