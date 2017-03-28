import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Customer} from '../../customer';
import {IndexCase} from '../../index-case';

import 'rxjs/add/operator/toPromise';
import * as _ from 'lodash';

@Injectable()
export class DataService {

  private customersUrl = 'assets/customers.json'; // customers with updatecases
  private indexCasesUrl = 'assets/index-cases.json'; // indexcases

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;

  constructor(private http: Http) {
  }

  /**
   * Returns promise of customers array from JSON object.
   * @returns {Promise<Customer[]>}
   */
  getCustomers(): Promise<Customer[]> {

    // get customers if not cached
    if (!this.customersPromise) {

      this.customersPromise = this.http.get(this.customersUrl)
        .toPromise() // convert observable to promise
        .then(response => response.json() as Customer[])
        .catch(this.handleError);
    }

    return this.customersPromise;
  }

  getIndexCases(): Promise<IndexCase[]> {
    if (!this.indexCasesPromise) {
      let unknownCase = {
        id: 0,
        type: 'UNKNOWN',
        representative: 'Andere Frage',
        industry: 'GENERAL'
      };
      this.indexCasesPromise = this.http.get(this.indexCasesUrl)
        .toPromise()
        .then(response => {

          // add special case
          let data = response.json();
          data.push(unknownCase);

          return data as IndexCase[]
        })
        .catch(this.handleError);
    }
    return this.indexCasesPromise;
  }

  getCustomer(id: number): Promise<Customer> {
    return this.getCustomers()
      .then(customers => customers.find(customer => customer.id === id));
  }

  getIndexCase(id: number): Promise<IndexCase> {
    return this.getIndexCases().then(indexCases => _.find(indexCases, indexCase => id === indexCase['id']) as IndexCase);
  }

  /**
   * Creates flat array of all real update cases from customer list data by skipping pseudo deletes and adding "UPDATE" type
   * @param customerData
   * @returns {Array}
   */
  getRealUpdateCases(customerData: any[]): any[] {

    let updateCases = [];
    for (let customer of customerData) {
      let i = 0;
      customer.icuElements = _.sortBy(customer.icuElements, 'id');
      while (i < customer.icuElements.length) {
        let current = customer.icuElements[i];
        let next = customer.icuElements[i + 1];

        if (next !== undefined) {
          // store update
          if (current.indexCaseId !== next.indexCaseId && current.surface === next.surface && current.timeStamp === next.timeStamp) {
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
