import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-circle-packing',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './circle-packing.component.html',
  styleUrls: ['./circle-packing.component.css'],
  providers: [UpdateCaseService]
})
export class CirclePackingComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() indexCaseId: number;
  @Input() config: any = {
    height: 500
  };

  private customersPromise: Promise<Customer[]>;
  private customers: Customer[];
  private indexCasesPromise: Promise<IndexCase[]>;
  private indexCases: IndexCase[];
  private updateCases: any[];
  private loading: Boolean = true;
  private data: any;

  private svg: any;
  private margin: any = {top: 10, bottom: 10, left: 10, right: 10};
  private chart: any;
  private width: number;
  private height: number;
  private diameter: number;
  private color: any;
  private pack: any;

  constructor(private updateCaseService: UpdateCaseService, private router: Router) {
  }

  ngOnInit() {

    this.initChart();

    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ])
      .then(([customers, indexCases]) => {
        // console.log('customers', customers);
        // console.log('indexCases', indexCases);

        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(customers);
        this.indexCases = indexCases;

        this.loading = false;

        this.updateChart();

      })
      .catch(err => {
        // Receives first rejection among the Promises
        console.log(err);
      });
  }

  initChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = this.width;
    this.diameter = this.width;

    this.svg = d3.select(element).append('svg')
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.color = d3.scaleLinear<any>()
      .domain([-1, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    this.pack = d3.pack()
      .size([this.diameter - this.margin.left, this.diameter - this.margin.right])
      .padding(2);
  }

  updateChart() {
    // todo: implement update
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetWidth);
    // todo: implement resize
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  onResize() {
    this.resizeChart();
  }

  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

}
