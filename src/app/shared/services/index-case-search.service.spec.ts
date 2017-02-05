/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IndexCaseSearchService } from './index-case-search.service';

describe('IndexCaseSearchService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexCaseSearchService]
    });
  });

  it('should ...', inject([IndexCaseSearchService], (service: IndexCaseSearchService) => {
    expect(service).toBeTruthy();
  }));
});
