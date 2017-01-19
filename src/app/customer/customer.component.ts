import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params}   from '@angular/router';
import {Location}                 from '@angular/common';
import {UpdateCaseService} from 'app/shared/update-case.service';
import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})


export class CustomerComponent implements OnInit {

  @Input() customer: any;

  constructor(private updateCaseService: UpdateCaseService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit() {
    this.route.params
      .switchMap((params: Params) => this.updateCaseService.getCustomer(+params['id']))
      .subscribe(customer => {
        this.customer = customer;
      });
  }

  goBack(): void {
    this.location.back();
  }

}
