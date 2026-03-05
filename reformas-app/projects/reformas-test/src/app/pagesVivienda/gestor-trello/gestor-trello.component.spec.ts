import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorTrelloComponent } from './gestor-trello.component';

describe('GestorTrelloComponent', () => {
  let component: GestorTrelloComponent;
  let fixture: ComponentFixture<GestorTrelloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorTrelloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestorTrelloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
