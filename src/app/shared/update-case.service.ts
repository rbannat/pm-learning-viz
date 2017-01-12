import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import { Customer } from '../customer';
import { IndexCase } from '../index-case';

import 'rxjs/add/operator/toPromise';
import * as _ from 'lodash';

@Injectable()
export class UpdateCaseService {

  private customersUrl = 'assets/customers.json'; // customers with updatecases
  private indexCasesUrl = 'assets/index-cases.json'; // indexcases

  constructor(private http: Http) {
  }

  getCustomers(): Promise<Customer[]> {
    return this.http.get(this.customersUrl)
      .toPromise()
      .then(response => response.json() as Customer[])
      .catch(this.handleError);
  }

  getIndexCases(): Promise<IndexCase[]> {

    let unknownCase = {
      id: 0,
      type: 'UNKNOWN',
      representative: 'Andere Frage',
      industry: 'GENERAL'
    };

    return this.http.get(this.indexCasesUrl)
      .toPromise()
      .then(response => {

        // add special case
        let data = response.json();
        data.push(unknownCase);

        return data as IndexCase[]
      })
      .catch(this.handleError);
  }

  getCustomer(id: number): Promise<Customer> {
    return this.getCustomers()
      .then(customers => customers.find(customer => customer.id === id));
  }

  getIndexCase(id: number): Promise<IndexCase> {
    return this.getIndexCases().then(indexCases => _.find(indexCases, indexCase => id === indexCase['id']) as IndexCase);
  }

  /**
   * Creates flat array of all update cases from customer list data
   * @param customerData
   * @returns {Array}
   */
  getUpdateCases(customerData: any[]): any[] {

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
   * Returns all existing categories.
   * @param categories
   * @returns {Array}
   */
  getCategories(customerData: any[]): any[] {

    let categories = [];
    for (let customer of customerData) {
      for (let icu of customer.icuElements) {
        if (!_.find(categories, ['id', icu.indexCaseId])) {
          categories.push({id: icu.indexCaseId});
        }
      }
    }
    return categories;
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
