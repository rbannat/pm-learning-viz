import {Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

import {DataService} from '../../services/data.service';
import {FilterService} from 'app/shared/services/filter.service';

import {Customer} from '../../../customer';

@Component({
  selector: 'app-updates-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'bar-chart.component.html',
  styleUrls: ['bar-chart.component.css']
})
export class BarChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() indexCaseId: number;

  private customersPromise: Promise<Customer[]>;
  private customerSubscription: any;
  private sidebarSubscription: any;
  private updateCases: any;
  private customers: any;
  private data: any[];
  private loading: boolean = true;

  private svg: any;
  private chart: any;
  private margin: any = {top: 10, bottom: 30, left: 30, right: 25};
  private width: number;
  private height: number = 350;
  private y: any;
  private x: any;
  private z: any;
  private priorityOrder = ['NEW', 'UPDATE', 'DELETE'];

  constructor(private updateCaseService: DataService,
              private filterService: FilterService) {

    // update chart when customer filter changed
    this.customerSubscription = filterService.customerObservable.subscribe(data => {

      this.getCustomers();

      this.customersPromise.then((customers) => {
        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(this.customers);
        this.updateChart();
      })
        .catch(err => {
          console.log(err);
        });
    });

    // resize chart when filter is opened or closed
    this.sidebarSubscription = filterService.sidebarObservable.subscribe(data => {
      this.resizeChart();
    });
  }

  ngOnInit() {

    this.getCustomers();

    Promise.all<Customer[]>([
      this.customersPromise
    ])
      .then(([customers]) => {

        this.initChart();

        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(customers);

        this.updateChart();

        this.loading = false;

      })
      .catch(err => {
        console.log(err);
      });
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy() {
    this.customerSubscription.unsubscribe();
    this.sidebarSubscription.unsubscribe();
  }

  onResize() {
    this.resizeChart();
  }

  /**
   *  Initializes chart elements.
   */
  initChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = this.height - this.margin.top - this.margin.bottom;

    this.x = d3.scaleBand().rangeRound([0, this.width]).padding(0.1);
    this.y = d3.scaleLinear().rangeRound([this.height, 0]);

    this.z = d3.scaleOrdinal()
      .range(["#4CAF50", "#FFC107", "#F44336"])
      .domain(['NEW', 'UPDATE', 'DELETE']);

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', 350);

    // chart area
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // add axes
    this.chart.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.height + ")");

    this.chart.append("g")
      .attr("class", "axis axis--y");
  }

  /**
   *  Re-renders chart with new input data.
   */
  updateChart() {

    // Data
    this.data = d3.nest<any, number>()
      .key(function (d) {
        return d['updateType'];
      }).sortKeys((a, b) => {
        return this.priorityOrder.indexOf(a) - this.priorityOrder.indexOf(b);
      })
      .rollup(function (d) {
        return d.length;
      })
      .entries(_.filter(this.updateCases, (o) => {
        if (o['indexCaseId'] === this.indexCaseId || o['source'] === this.indexCaseId) return o
      }));

    // Scales
    this.x.domain(this.data.map(function (d) {
      return d.key;
    }));
    this.y.domain([0, d3.max(this.data, function (d) {
      return d.value;
    })]);

    // Axes
    this.chart.select(".axis--x")
      .transition().duration(300).call(d3.axisBottom(this.x));

    this.chart.select(".axis--y")
      .transition().duration(300).call(d3.axisLeft(this.y));

    // Bars selection
    let bars = this.chart.selectAll(".bar")
      .data(this.data);

    // EXIT
    bars.exit().remove();

    // ENTER
    bars.enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => {
        return this.x(d.key);
      })
      .attr("y", d => {
        return this.y(d.value);
      })
      .attr("width", this.x.bandwidth())
      .attr("height", d => {
        return this.height - this.y(d.value);
      })
      .attr("fill", d => {
        return this.z(d.key);
      });

    // UPDATE
    bars.transition().duration(300)
      .attr("x", d => {
        return this.x(d.key);
      })
      .attr("y", d => {
        return this.y(d.value);
      })
      .attr("width", this.x.bandwidth())
      .attr("height", d => {
        return this.height - this.y(d.value);
      })
      .attr("fill", d => {
        return this.z(d.key);
      });

    // Value labels selection
    let values = this.chart.selectAll(".amount")
      .data(this.data);

    // EXIT
    values.exit().remove();

    // ENTER
    values
      .enter().append("text")
      .attr("x", d => {
        return this.x(d.key) + this.x.bandwidth() / 2;
      })
      .attr("y", d => {
        return this.y(d.value) + 10;
      })
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text(function (d) {
        return d.value;
      });

    // UPDATE
    values.transition().duration(300)
      .attr("x", d => {
        return this.x(d.key) + this.x.bandwidth() / 2;
      })
      .attr("y", d => {
        return this.y(d.value) + 10;
      })
      .text(function (d) {
        return d.value;
      });

  }

  /**
   *  Re-renders chart with new dimensions. Called on window size change.
   */
  resizeChart() {
    let self = this;
    let element = self.chartContainer.nativeElement;

    // update width
    self.width = element.offsetWidth - self.margin.left - self.margin.right;

    // update svg width
    d3.select(element).select('svg').attr('width', element.offsetWidth);

    // update x-scale range
    self.x.rangeRound([0, self.width]);

    // update bars width
    self.chart
      .selectAll(".bar")
      .attr("x", d => {
        return self.x(d.key);
      })
      .attr("width", self.x.bandwidth());

    // update value labels position
    this.chart.selectAll(".amount")
      .attr("x", d => {
        return this.x(d.key) + this.x.bandwidth() / 2;
      })
      .attr("y", d => {
        return this.y(d.value) + 10;
      });

    // update x-axis labels
    d3.select(element).select('.axis--x')
      .call(d3.axisBottom(this.x));
  }


  getCustomers(): void {
    this.customersPromise = this.filterService.getFilteredCustomers();
  }
}
