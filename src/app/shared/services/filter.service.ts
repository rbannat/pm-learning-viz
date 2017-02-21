import {Injectable} from '@angular/core';
import {UpdateCaseService} from 'app/shared/services/update-case.service';
import {Customer} from 'app/customer';

@Injectable()
export class FilterService {

  private customersPromise: Promise<Customer[]>;

  constructor(private updateCaseService: UpdateCaseService) {
    this.customersPromise = updateCaseService.getCustomers().then(customers => {
      return customers.map(customer => {
        customer['visible'] = true;
        return customer;
      })
    });
  }

  getfilteredCustomers(customers) {
    return this.customersPromise
      .then(customers => customers.filter(customer => {
        return customers.find(e => e['customer'] === customer['customer'] && e['visible']);
      }));
  }

  getCustomers() {
    return this.customersPromise;
  }

}
