import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params}   from '@angular/router';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {IndexCase} from 'app/index-case';
import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'app-index-case',
  templateUrl: './index-case.component.html',
  styleUrls: ['./index-case.component.css']
})
export class IndexCaseComponent implements OnInit {

  @Input() indexCase: IndexCase;

  constructor(private updateCaseService: UpdateCaseService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params
      .switchMap((params: Params) => this.updateCaseService.getIndexCase(+params['id']))
      .subscribe(indexCase => {

        this.indexCase = indexCase;





      });
  }

}
