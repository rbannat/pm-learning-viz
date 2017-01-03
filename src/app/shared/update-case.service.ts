import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class UpdateCaseService {

  private customersUrl = 'assets/customer-list.json'; // updatecase/list
  private customerByIdUrl = '/updatecase/customer/list?id=';

  constructor(private http: Http) { }

  getCustomers(): Promise<any> {
    return this.http.get(this.customersUrl)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  // getCustomerById(id: number): Promise<any> {
  //   return this.http.get(this.customerByIdUrl+id)
  //     .toPromise()
  //     .then(response => response.json() as any)
  //     .catch(this.handleError);
  // }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
