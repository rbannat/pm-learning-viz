import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params}   from '@angular/router';
import {DataService} from '../shared/services/data.service';
import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'app-customer',
  templateUrl: 'customer-detail.component.html',
  styleUrls: ['customer-detail.component.css']
})


export class CustomerDetailComponent implements OnInit {

  @Input() customer: any;

  constructor(private updateCaseService: DataService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params
      .switchMap((params: Params) => this.updateCaseService.getCustomer(+params['id']))
      .subscribe(customer => {
        this.customer = customer;
      });
  }
}
