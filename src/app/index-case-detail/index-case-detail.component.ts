import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params}   from '@angular/router';
import {DataService} from '../shared/services/data.service';
import {IndexCase} from 'app/index-case';
import 'rxjs/add/operator/switchMap';
import {ColorsService} from "../shared/services/colors.service";

@Component({
  selector: 'app-index-case',
  templateUrl: 'index-case-detail.component.html',
  styleUrls: ['index-case-detail.component.css']
})
export class IndexCaseDetailComponent implements OnInit {

  @Input() indexCase: IndexCase;
  private actionTypeColor: string;

  constructor(private updateCaseService: DataService,
              private colorsService: ColorsService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {

    this.route.params
      .switchMap((params: Params) => this.updateCaseService.getIndexCase(+params['id']))
      .subscribe(indexCase => {
        this.indexCase = indexCase;
        this.actionTypeColor = this.colorsService.getColor(this.indexCase['type']);
      });
  }

}
