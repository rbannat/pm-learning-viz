import {Injectable} from '@angular/core';
import {UpdateCaseService} from 'app/shared/services/update-case.service';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class FilterService {

  customerStates: any[];
  indexCasesStates: any[];
  customerObservable: Subject<any> = new Subject<any>();
  indexCasesObservable: Subject<any> = new Subject<any>();
  sidebarObservable: Subject<any> = new Subject<any>();

  constructor(private updateCaseService: UpdateCaseService) {
   updateCaseService.getCustomers().then(customers => {
      this.customerStates = customers.map(customer => {
        customer['visible'] = true;
        return customer;
      });
    });

    updateCaseService.getIndexCases().then(ics => {
      this.indexCasesStates = ics.map(ic => {
        ic['visible'] = true;
        return ic;
      });
    });
  }

  getFilteredCustomers() {
      return this.customerStates.filter(customer => {
        return this.customerStates.find(c => c.customer === customer['customer']).visible === true;
      });
  }

  getFilteredIndexCases() {
    return this.indexCasesStates.filter(indexCase => {
      return this.indexCasesStates.find(i => i.id === indexCase['id']).visible === true;
    });
  }

  updateCustomerState(customer, visible){
    let updatedCustomer = this.customerStates.find(c => c.customer === customer.customer);
    updatedCustomer.visible = visible;
    this.customerObservable.next(updatedCustomer);
    console.log(updatedCustomer.customer + ' visibility changed to ' + updatedCustomer.visible);
  }

  updateIndexCaseState(indexCase, visible){
    let updatedIndexCase = this.indexCasesStates.find(ic => ic.id === indexCase.id);
    indexCase.visible = visible;
    this.indexCasesObservable.next(updatedIndexCase);
    console.log(updatedIndexCase.id + ' visibility changed to ' + updatedIndexCase.visible);
  }

}
