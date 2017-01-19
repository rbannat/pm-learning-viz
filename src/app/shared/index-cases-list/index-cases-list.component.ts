import {Component, OnInit, Input} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {IndexCase} from 'app/index-case';

@Component({
  selector: 'app-index-cases-list',
  templateUrl: './index-cases-list.component.html',
  styleUrls: ['./index-cases-list.component.css']
})
export class IndexCasesListComponent implements OnInit {

  @Input() topX: number;
  @Input() customer: string;

  private indexCases: any = [];
  private indexCasesPromise: Promise<IndexCase[]>;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {
    this.getIndexCases();

    Promise.all<IndexCase[]>([
      this.indexCasesPromise
    ]).then(([indexCases]) => {

      this.indexCases = indexCases.filter(ic => ic['last_modified']).sort((a,b) => {
        return a['last_modified'] - b['last_modified'];
      }).reverse().map(ic => {
        let newIc = ic;
        newIc['customer'] = window.atob(ic['customerHash']).split('#')[0];
        return newIc;
      });

      if (this.customer) {
        this.indexCases = this.indexCases.filter(ic => ic['customer'] === this.customer);
      }

      if(this.topX) this.indexCases = this.indexCases.slice(0,this.topX);

    });
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

}
