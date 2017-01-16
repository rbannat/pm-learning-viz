import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';

import {UpdateCaseService} from 'app/shared/update-case.service';
import {Customer} from 'app/customer';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-updates-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './updates-barchart.component.html',
  styleUrls: ['./updates-barchart.component.css'],
  providers: [UpdateCaseService]
})
export class UpdatesBarchartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() indexCaseId: number;

  private customersPromise: Promise<Customer[]>;
  private loading: boolean = true;
  private data: any[];
  private updateCases: any;
  private customers: any;

  private margin: any = {top: 10, bottom: 30, left: 30, right: 25};
  private priority_order = ['NEW', 'UPDATE', 'DELETE'];
  private svg: any;
  private chart: any;
  private width: number;
  private height: number = 350;
  private y: any;
  private x: any;
  private z: any;

  constructor(private updateCaseService: UpdateCaseService, private router: Router) {
  }

  ngOnInit() {

    this.getCustomers();
    this.initChart();

    Promise.all<Customer[]>([
      this.customersPromise
    ])
      .then(([customers]) => {
        // console.log('customers', customers);

        this.customers = customers;
        this.updateCases = this.updateCaseService.getRealUpdateCases(customers);

        this.loading = false;

        this.updateChart();

      })
      .catch(err => {
        // Receives first rejection among the Promises
        console.log(err);
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

  updateChart() {

    // Data
    this.data = d3.nest<any, number>()
      .key(function (d) {
        return d['updateType'];
      }).sortKeys((a, b) => {
        return this.priority_order.indexOf(a) - this.priority_order.indexOf(b);
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

    // Bars
    let bars = this.chart.selectAll(".bar")
      .data(this.data);
    bars.exit().remove();
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

    // Value labels
    let values = this.chart.selectAll(".amount")
      .data(this.data);
    values.exit().remove();
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
    values.transition().duration(300)
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

  }

  resizeChart() {
    let self = this;
    let element = self.chartContainer.nativeElement;

    self.width = element.offsetWidth - self.margin.left - self.margin.right;

    d3.select(element).select('svg').attr('width', element.offsetWidth);

    self.x.rangeRound([0, self.width]);

    self.chart
      .selectAll(".bar")
      .attr("x", d => {
        return self.x(d.key);
      })
      .attr("width", self.x.bandwidth());

    // amount labels
    this.chart.selectAll(".amount")
      .attr("x", d => {
        return this.x(d.key) + this.x.bandwidth() / 2;
      })
      .attr("y", d => {
        return this.y(d.value) + 10;
      });

    d3.select(element).select('.axis--x')
      .call(d3.axisBottom(this.x));
  }


  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }
}
