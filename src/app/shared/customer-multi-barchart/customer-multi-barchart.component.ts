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
  private categories: any;
  private margin: any = {top: 10, bottom: 10, left: 50, right: 25};
  private svg: any;
  private chart: any;
  private width: number;
  private height: number;
  private barGroupHeight = 60;
  private y0: any;
  private y1: any;
  private x: any;
  private z: any;
  private keys: string[];
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
        this.categories = this.updateCaseService.getCategories(response);
        this.customer = this.customers.find(customer => customer.id === this.customerId);

        this.updateCases = this.updateCaseService.getRealUpdateCases(response);

        this.data = d3.nest<any, number>()
          .key(function (d) {
            return d['indexCaseId'];
          })
          .key(function (d) {
            return d['updateType'];
          })
          .rollup(function (d) {
            return d.length;
          })
          .entries(_.filter(this.updateCases, (o) => {
            if (o['customerId'] === this.customer.id) return o
          }));

        // sort by number of total updatecases
        this.data = _.sortBy(this.data, function (el) {
          return _.sumBy(el['values'], (o) => o['value']);
        }).reverse();

        console.log(this.data);

        this.loading = false;

        this.initChart();
        this.updateChart();
      }
    );
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
    this.height = this.barGroupHeight * this.data.length + this.margin.top + this.margin.bottom;
    this.keys = ['NEW', 'UPDATE', 'DELETE'];

    d3.select(element).html('<p class="lead">Number of Updatecases per Category</p>');

    this.y0 = d3.scaleBand()
      .rangeRound([0, this.height])
      .paddingInner(0.1);

    this.y1 = d3.scaleBand()
      .padding(0.05);

    this.x = d3.scaleLinear()
      .rangeRound([0, this.width - 100]);

    this.z = d3.scaleOrdinal()
      .range(["#4CAF50","#FFC107", "#F44336"])
      .domain(['NEW', 'UPDATE', 'DELETE']);

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  updateChart() {
    let self = this;

    this.y0.domain(this.data.map(function (d) {
      return d.key;
    }));

    this.y1
      .domain(this.keys)
      .rangeRound([0, self.y0.bandwidth()]);

    this.x.domain([0, d3.max(this.data, function (d) {
      return d3.max(d['values'], function (d) {
        return d['value'];
      });
    })]).nice();

    let barGroup = this.chart.append("g")
      .selectAll("g")
      .data(this.data)
      .enter().append("g")
      .attr("transform", function (d) {
        return "translate(0," + self.y0(d.key) + ")";
      })
      .attr('class', 'bars');

    let bar = barGroup.selectAll("rect")
      .attr('class', 'bar')
      .data(function (d) {
        return d.values;
      });

    bar.enter().append("rect")
      .attr("x", function (d) {
        return 0;
      })
      .attr("y", function (d) {
        return self.y1(d.key);
      })
      .attr("height", self.y1.bandwidth())
      .attr("width", function (d) {
        return self.x(d.value);
      })
      .attr("fill", function (d) {
        return self.z(d.key);
      });

    bar.enter().append("text")
      .attr("x", d => self.x(d.value) - 3)
      .attr("y", d => self.y1(d.key) + self.y1.bandwidth()/2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text(function (d) {
        return d.value;
      });

    this.chart.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(self.y0));

    let legend = this.chart.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .attr("class", "legend")
      .selectAll("g")
      .data(self.keys)
      .enter().append("g")
      .attr("transform", function (d, i) {
        return "translate(0," + i * 20 + ")";
      });

    legend.append("rect")
      .attr("x", this.width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", this.z);

    legend.append("text")
      .attr("x", this.width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function (d) {
        return d;
      });
  }

  resizeChart() {
    let self = this;

    let element = self.chartContainer.nativeElement;
    self.width = element.offsetWidth - self.margin.left - self.margin.right;

    d3.select(element).select('svg').attr('width', element.offsetWidth);

    self.x.rangeRound([0, self.width]);

    self.chart
      .selectAll(".bars rect")
      .attr("width", function (d) {
        return self.x(d.value);
      });

    //update legend
    let legend = self.chart
      .select(".legend");
    legend.selectAll("rect")
      .attr("x", this.width - 19);
    legend.selectAll("text")
      .attr("x", this.width - 24);

    // sort
    this.change();
  }

  change() {

    let self = this;
    // Copy-on-write since tweens are evaluated after a delay.
    var y0 = this.y0.domain(this.data.sort(
      function (a, b) {
        return b.count - a.count;
      })
      .map(function (d) {
        return d.key;
      }))
      .copy();

    this.chart.selectAll(".bar")
      .sort(function (a, b) {
        return y0(a.key) - y0(b.key);
      });

    var transition = this.svg.transition().duration(750),
      delay = function (d, i) {
        return i * 50;
      };

    transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function (d) {
        return y0(d.key);
      });
  }

  getCustomers(): void {
    this.dataPromise = this.updateCaseService.getCustomers();
  }

}
