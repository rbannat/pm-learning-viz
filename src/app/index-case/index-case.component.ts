import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params}   from '@angular/router';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {IndexCase} from 'app/index-case';
import 'rxjs/add/operator/switchMap';
import {ColorsService} from "../shared/colors.service";

@Component({
  selector: 'app-index-case',
  templateUrl: './index-case.component.html',
  styleUrls: ['./index-case.component.css'],
  providers: [ColorsService]
})
export class IndexCaseComponent implements OnInit {

  @Input() indexCase: IndexCase;
  private actionTypeColor:string;

  constructor(private updateCaseService: UpdateCaseService,
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
