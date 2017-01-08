import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';

import {UpdateCaseService} from 'app/shared/update-case.service';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-customer-multi-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './customer-multi-barchart.component.html',
  styleUrls: ['./customer-multi-barchart.component.css'],
  providers: [UpdateCaseService]
})
export class CustomerMultiBarchartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() customerId: any;
  private margin: any = {top: 10, bottom: 10, left: 10, right: 25};
  private svg:any;
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private barHeight = 20;
  private leftMargin = 100;
  private y0:any;
  private y1:any;
  private x:any;
  private z:any;
  dataPromise: Promise<any>;
  data: any;
  customers: any;
  private customer: any;
  updateCases: any;
  loading: Boolean = true;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {
    this.getCustomers();

    this.dataPromise.then((response) => {

      this.customers = response;
      this.customer = this.customers.find(customer => customer.id === this.customerId);

      this.updateCases = this.updateCaseService.getRealUpdateCases(response);

      this.data = {
        id: this.customer.id,
        name: this.customer.customer,
        updateCases: _.filter(this.updateCases, (o) => {
          if (o['customerId'] === this.customer.id) return o
        })
      };

      this.loading = false;

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
    this.height = this.barHeight * this.data.length + this.margin.top + this.margin.bottom;

    d3.select(element).html('<p class="lead">Number of Updatecases</p>');

    this.y0 = d3.scaleBand()
      .rangeRound([this.height, 0])
      .paddingInner(0.1);

    this.y1 = d3.scaleBand()
      .padding(0.05);

    this.x = d3.scaleLinear()
      .rangeRound([0, this.width]);

    this.z = d3.scaleOrdinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = this.svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // // xDomain
    // let xDomain = [0, d3.max(this.data, d => d['updateCaseCount'])];
    // // xScale
    // this.xScale = d3.scaleLinear()
    //   .domain(xDomain)
    //   .range([0, this.width - this.leftMargin]);
  }

  updateChart() {
    this.xScale.domain([0, d3.max(this.data, d => d['updateCaseCount'])]);

    var keys = this.data.columns.slice(1); // todo: right format
    this.y0.domain(this.data.map(function(d) { return d.customer; }));
    this.y1.domain(keys).rangeRound([0, this.y0.bandwidth()]);
    this.x.domain([0, d3.max(this.data, function(d) { return d3.max(keys, function(key) { return d['key']; }); })]).nice();

    this.chart.append("g")
      .selectAll("g")
      .data(this.data)
      .enter().append("g")
      .attr("transform", function(d) { return "translate(" + this.y0(d.customer) + ",0)"; })
      .selectAll("rect")
      .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
      .enter().append("rect")
      .attr("x", function(d) { return this.y1(d.key); })
      .attr("y", function(d) { return this.x(d.value); })
      .attr("width", this.y1.bandwidth())
      .attr("height", function(d) { return this.height - this.xy(d.value); })
      .attr("fill", function(d) { return this.z(d.key); });

    this.chart.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.y0));

    this.chart.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(this.x).ticks(null, "s"))
      .append("text")
      .attr("x", 2)
      .attr("y", this.x(this.x.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Population");

    var legend =  this.chart.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", this.width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", this.z);

    legend.append("text")
      .attr("x", this.width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });
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
    this.dataPromise = this.updateCaseService.getCustomers();
  }

}
