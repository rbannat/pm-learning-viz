import {Injectable} from '@angular/core';
import {UpdateCaseService} from 'app/shared/services/update-case.service';
import {Customer} from 'app/customer';
import {Observable} from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class FilterService {

  customerStates: any[];
  customerObservable: Subject<any> = new Subject<any>();

  constructor(private updateCaseService: UpdateCaseService) {
   updateCaseService.getCustomers().then(customers => {
      this.customerStates = customers.map(customer => {
        customer['visible'] = true;
        return customer;
      });
    });
  }

  getfilteredCustomers() {
      return this.customerStates.filter(customer => {
        return this.customerStates.find(c => c.customer === customer['customer']).visible === true;
      });
  }

  updateCustomerState(customer, visible){
    this.customerStates.find(c => c.customer === customer.customer).visible = visible;
    this.customerObservable.next();
  }

}
