import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UpdateCaseService} from 'app/shared/services/update-case.service';
import {FilterService} from 'app/shared/services/filter.service';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-customers-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './customers-barchart.component.html',
  styleUrls: ['./customers-barchart.component.css']
})
export class CustomersBarchartComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() topX: number;
  @Input() indexCaseId: number;

  private orderBy: string = 'value';
  private sortDesc: boolean = true;

  private margin: any = {top: 20, bottom: 10, left: 10, right: 25};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private barHeight = 20;
  private leftMargin = 100;
  private customersPromise: Promise<any>;
  private data: any[];
  private customers: any;
  private updateCases: any;
  private loading: Boolean = true;
  private svg: any;

  constructor(private updateCaseService: UpdateCaseService,
              private filterService: FilterService,
              private router: Router) {

    //https://angular.io/docs/ts/latest/cookbook/component-communication.html#!#bidirectional-service

    filterService.customerObservable.subscribe(data => {
      this.customers = filterService.getFilteredCustomers();
      this.updateChart();
    });

  }

  ngOnInit() {
    this.getCustomers();
    this.customersPromise.then((response) => {

      this.loading = false;

      // this.customers = response;
      this.customers = this.filterService.getFilteredCustomers();
      this.updateCases = this.updateCaseService.getRealUpdateCases(response);

      this.initChart();
      this.updateChart();
    });
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  onResize() {
    this.resizeChart();
  }

  initChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;


    // d3.select(element).html('<p class="lead">Number of Updatecases</p>');

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth);


    // chart area
    this.chart = this.svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // scales
    this.xScale = d3.scaleLinear()
      .range([0, this.width - this.leftMargin]);

    this.yScale = d3.scaleBand();
  }

  updateChart() {

    let customers = this.customers;
    let updateCases = this.updateCases;

    // Data
    if (this.indexCaseId !== undefined) {
      customers = _.filter(this.customers, customer => _.some(customer['icuElements'], icuElement => icuElement['indexCaseId'] === this.indexCaseId));
      updateCases = _.filter(this.updateCases, updateCase => updateCase['indexCaseId'] === this.indexCaseId || updateCase['source'] === this.indexCaseId);
    }

    this.data = _.map(customers, customer => {
      return {
        id: customer['id'],
        customer: customer['customer'],
        updateCaseCount: _.filter(updateCases, updateCase => {
          return updateCase['customerId'] === customer['id']
        }).length
      }
    });

    this.data.sort(function (a, b) {
      return b["updateCaseCount"] - a["updateCaseCount"];
    });

    if (this.topX) {
      this.data = this.data.slice(0, this.topX);
    }

    // Update SVG
    this.height = this.barHeight * this.data.length + this.margin.top + this.margin.bottom;
    this.svg.attr('height', this.height);

    // Scales
    let xDomain = [0, d3.max(this.data, d => d['updateCaseCount'])];
    this.xScale.domain(xDomain);

    this.yScale
      .domain(this.data.map(function (d) {
        return d.customer;
      }))
      .rangeRound([0, this.barHeight * this.data.length])
      .paddingInner(0.1);

    // Bars
    let update = this.chart.selectAll('.bar')
      .data(this.data);

    // EXIT
    update.exit().remove();

    // ENTER
    let bars = update
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.customer) + ')');
    bars.append("text")
      .attr('class', 'label')
      .attr("x", function (d) {
        return -10;
      })
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) {
        return d['customer'];
      })
      .on('click', d => {
        this.gotoDetail(d.id)
      });
    bars.append("rect")
      .attr("width", d => this.xScale(d['updateCaseCount']))
      .attr("height", this.barHeight - 1);
    bars.append("text")
      .attr("x", d => this.xScale(d['updateCaseCount']) - 3)
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text(function (d) {
        return (d['updateCaseCount'] < 5) ? '' : d['updateCaseCount'];
      });

    // UPDATE
    update.attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.customer) + ')');
    update.select('.label')
      .text(function (d) {
        return d['customer'];
      });
    update.select('rect').transition().duration(300)
      .attr("width", d => this.xScale(d['updateCaseCount']));
    update.select('.amount').transition().duration(300)
      .attr("x", d => this.xScale(d['updateCaseCount']) - 3)
      .text(function (d) {
        return (d['updateCaseCount'] < 5) ? '' : d['updateCaseCount'];
      });
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg').attr('width', element.offsetWidth);
    // xDomain
    let xDomain = [0, d3.max(this.data, d => d['updateCaseCount'])];
    // xScale
    this.xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, this.width - this.leftMargin]);

    let update = this.chart.selectAll('.bar');
    update.select('rect').attr("width", d => this.xScale(d['updateCaseCount']));
    update.select('.amount').attr("x", d => this.xScale(d['updateCaseCount']) - 3);
  }

  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  gotoDetail(customerId: number): void {
    this.router.navigate(['/customers', customerId]);
  }

  changeSortOrder() {
    this.sortDesc = !this.sortDesc;
    this.change(this.orderBy);
  }

  change(event) {
    this.orderBy = event;

    if (this.orderBy === 'key') {
      this.data.sort((a, b) => {
        let aName = a.customer.toLowerCase();
        let bName = b.customer.toLowerCase();
        if (this.sortDesc) {
          return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        } else {
          return ((bName < aName) ? -1 : ((bName > aName) ? 1 : 0));
        }
      });
    } else {
      this.data.sort((a, b) => {
        if (this.sortDesc) {
          return b["updateCaseCount"] - a["updateCaseCount"];
        } else {
          return a["updateCaseCount"] - b["updateCaseCount"];
        }
      });
    }

    this.yScale.domain(this.data.map(function (d) {
      return d.customer;
    }));

    this.chart.selectAll(".bar")
      .transition()
      .duration(300)
      .attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.customer) + ')');
  }

}
