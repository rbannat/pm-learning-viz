import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-forced-graph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './forced-graph.component.html',
  styleUrls: ['./forced-graph.component.css'],
  providers: [UpdateCaseService]
})
export class ForcedGraphComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() topX: number;
  private margin: any = {top: 10, bottom: 10, left: 10, right: 10};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private barHeight = 20;
  private leftMargin = 100;
  dataPromise: Promise<any>;
  data: any;
  loading: Boolean = true;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {
    this.getCustomers();

    this.dataPromise.then((response) => {
      this.data = response;

      this.data.sort(function (a, b) {
        return b["icuElements"].length - a["icuElements"].length;
      });

      if (this.topX) {
        this.data = this.data.slice(0, this.topX);
      }

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

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // xDomain
    let xDomain = [0, d3.max(this.data, d => d['icuElements'].length)];
    // xScale
    this.xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, this.width - this.leftMargin]);
  }

  updateChart() {
    this.xScale.domain([0, d3.max(this.data, d => d['icuElements'].length)]);

    let update = this.chart.selectAll('.bar')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    // ...

    // add new bars
    let bar = update
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + i * this.barHeight + ')');

    bar.append("text")
      .attr('class', 'label')
      .attr("x", function (d) {
        return -10;
      })
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) {
        return d['customer'];
      });

    bar.append("rect")
      .attr("width", d => this.xScale(d['icuElements'].length))
      .attr("height", this.barHeight - 1);

    bar.append("text")
      .attr("x", d => this.xScale(d['icuElements'].length) - 3)
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text(function (d) {
        return (d['icuElements'].length < 5) ? '' : d['icuElements'].length;
      });
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg').attr('width', element.offsetWidth);
    // xDomain
    let xDomain = [0, d3.max(this.data, d => d['icuElements'].length)];
    // xScale
    this.xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, this.width - this.leftMargin]);

    let update = this.chart.selectAll('.bar');
    update.select('rect').attr("width", d => this.xScale(d['icuElements'].length));
    update.select('.amount').attr("x", d => this.xScale(d['icuElements'].length) - 3);
  }

  getCustomers(): void {
    this.dataPromise = this.updateCaseService.getCustomers();
  }

}
