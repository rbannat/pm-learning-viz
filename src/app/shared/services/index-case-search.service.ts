import { Injectable } from '@angular/core';
import {Http, Response} from '@angular/http';
import { Observable } from 'rxjs';
import { Customer } from '../../customer';
import { IndexCase } from '../../index-case';

@Injectable()
export class IndexCaseSearchService {

  private indexCasesUrl = 'assets/index-cases.json'; // indexcases

  constructor(private http: Http) { }

  search(term: string): Observable<IndexCase[]> {
    return this.http
      .get(this.indexCasesUrl)
      .map((r: Response) => r.json().find(ic => ic.representative.includes(term)) as IndexCase[]);
  }

}
