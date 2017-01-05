import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class UpdateCaseService {

  private customersUrl = 'assets/customer-list.json'; // updatecase/list
  private customerByIdUrl = '/updatecase/customer/list?id=';

  constructor(private http: Http) {
  }

  getCustomers(): Promise<any> {
    return this.http.get(this.customersUrl)
      .toPromise()
      .then(response => response.json() as any)
      .catch(this.handleError);
  }

  /**
   * Creates flat array of all update cases from customer list data
   * @param customerData
   * @returns {Array}
   */
  getUpdateCases(customerData:any[]): any[] {

    let flatData = [];
    for (let customer of customerData) {
      for (let icu of customer.icuElements) {
        let newUpdateCase = icu;
        newUpdateCase.id = customer.id + '-' + icu.id;
        newUpdateCase.customerId = customer.id;
        flatData.push(newUpdateCase);
      }
    }
    return flatData;
  }

  /**
   * Creates flat array of all real update cases from customer list data by skipping pseudo deletes and adding "UPDATE" type
   * @param customerData
   * @returns {Array}
   */
  getRealUpdateCases(customerData:any[]): any[] {

    let updateCases = [];
    for (let customer of customerData) {
      let i = 0;

      while (i < customer.icuElements.length) {
        let current = customer.icuElements[i];
        let next = customer.icuElements[i + 1];

        if (next !== undefined) {
          // store update
          if (current.indexCaseId !== next.indexCaseId && current.surface === next.surface) {
            let newUpdateCase = current;
            newUpdateCase.id = customer.id + '-' + current.id;
            newUpdateCase.customerId = customer.id;
            newUpdateCase.source = next.indexCaseId;
            newUpdateCase.updateType = 'UPDATE';
            updateCases.push(newUpdateCase);

            if (next.updateType === 'DELETE') {
              // skip pseudo delete
              i += 2;
            } else {
              i++
            }
            // store new or deleted
          } else {

            let newUpdateCase = current;
            newUpdateCase.id = customer.id + '-' + current.id;
            newUpdateCase.customerId = customer.id;
            updateCases.push(newUpdateCase);

            i++
          }

          // store last element
        } else {

          let newUpdateCase = current;
          newUpdateCase.id = customer.id + '-' + current.id;
          newUpdateCase.customerId = customer.id;
          updateCases.push(newUpdateCase);

          i++
        }
      }
    }
    return updateCases;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
