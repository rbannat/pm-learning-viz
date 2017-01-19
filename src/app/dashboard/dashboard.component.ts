import { Component, OnInit } from '@angular/core';

import {UpdateCaseService} from 'app/shared/update-case.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  private customerCount: number;
  private indexCaseCount: number;
  private updateCaseCount: number;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;

  constructor(private updateCaseService: UpdateCaseService) { }

  ngOnInit() {
    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ])
      .then(([customers, indexCases]) => {
        // console.log('customers', customers);
        // console.log('indexCases', indexCases);

        this.customerCount = customers.length;
        this.updateCaseCount = this.updateCaseService.getRealUpdateCases(customers).length;
        this.indexCaseCount = indexCases.length;

      })
      .catch(err => {
        // Receives first rejection among the Promises
        console.log(err);
      });
  }

  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

}
