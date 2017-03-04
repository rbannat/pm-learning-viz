import { Component, OnInit } from '@angular/core';
import {DataService} from '../../services/data.service';
import {FilterService} from 'app/shared/services/filter.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit {

  private loading:boolean = true;
  private customers:any[];
  private indexCases:any[] = [];
  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;

  constructor(private updateCaseService: DataService,
              private filterService: FilterService) { }

  ngOnInit() {

    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ])
      .then(([customers, indexCases]) => {

        this.indexCases = indexCases.sort((a, b) => {
          let aName = a['representative'].toLowerCase();
          let bName = b['representative'].toLowerCase();
          return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        });

        this.customers = customers.sort((a, b) => {
          let aName = a['customer'].toLowerCase();
          let bName = b['customer'].toLowerCase();
            return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        });

        this.loading = false;

      })
      .catch(err => {
        // Receives first rejection among the Promises
        console.log(err);
      });

  }

  getCustomers(): void {

    // get customers from filterService
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

  onChangeCustomer(customer){
    this.filterService.updateCustomerState(customer, customer['visible']);
  }
  onChangeIndexCase(indexCase){
    this.filterService.updateIndexCaseState(indexCase, indexCase['visible']);
  }

}
