import {Component, OnInit, OnDestroy} from '@angular/core';

import {DataService} from '../shared/services/data.service';
import {FilterService} from '../shared/services/filter.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private customers: any;
  private indexCases: any;
  private updateCases: any;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;
  private customerSubscription: any;
  private indexCaseSubscription: any;

  constructor(private updateCaseService: DataService,
              private filterService: FilterService) {

    this.customerSubscription = filterService.customerObservable.subscribe(data => {

      this.getCustomers();

      this.customersPromise.then((customers) => {
        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(this.customers);
      })
        .catch(err => {
          console.log(err);
        });

    });

    this.indexCaseSubscription = filterService.indexCasesObservable.subscribe(data => {

      this.getIndexCases();

      this.indexCasesPromise.then((indexCases) => {
        this.indexCases = indexCases;
      })
        .catch(err => {
          console.log(err);
        });

    });
  }

  ngOnInit() {
    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ])
      .then(([customers, indexCases]) => {

        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(customers);
        this.indexCases = indexCases;

      })
      .catch(err => {
        // Receives first rejection among the Promises
        console.log(err);
      });
  }

  ngOnDestroy() {
    this.customerSubscription.unsubscribe();
    this.indexCaseSubscription.unsubscribe();
  }

  getCustomers(): void {
    this.customersPromise = this.filterService.getFilteredCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.filterService.getFilteredIndexCases();
  }

}
