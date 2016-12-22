/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { UpdateCaseService } from './update-case.service';

describe('UpdateCaseService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UpdateCaseService]
    });
  });

  it('should ...', inject([UpdateCaseService], (service: UpdateCaseService) => {
    expect(service).toBeTruthy();
  }));
});
