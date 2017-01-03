import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import * as d3 from 'd3';

const graphData: any = {
  "nodes": [
    {"id": "Myriel", "group": 1, "r": 5},
    {"id": "Napoleon", "group": 1, "r": 10},
    {"id": "Mlle.Baptistine", "group": 1, "r": 20}
  ],
  "links": [
    {"source": "Napoleon", "target": "Myriel", "value": 1},
    {"source": "Mlle.Baptistine", "target": "Myriel", "value": 8}
  ]
};

@Component({
  selector: 'app-forced-graph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './forced-graph.component.html',
  styleUrls: ['./forced-graph.component.css'],
  providers: [UpdateCaseService]
})
export class ForcedGraphComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  private margin: any = {top: 10, bottom: 10, left: 10, right: 10};
  private chart: any;
  private width: number;
  private height: number;
  private simulation: any;
  private color: any;
  dataPromise: Promise<any>;
  data: any;
  loading: Boolean = true;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {
    this.getGraphData();

    this.dataPromise.then((response) => {
      // this.data = response;
      // todo: transform to graph data
      this.data = graphData;

      // this.data.sort(function (a, b) {
      //   return b["icuElements"].length - a["icuElements"].length;
      // });

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
    this.height = 500 + this.margin.top + this.margin.bottom;

    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function (d) {
        return d['id'];
      }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    this.color = d3.scaleOrdinal(d3.schemeCategory20);

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = svg.append('g')
      .attr('class', 'graph')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  dragstarted(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragended(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  updateChart() {

    let link = this.chart.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.data.links)
      .enter().append("line")
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value);
      });

    let node = this.chart.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.data.nodes)
      .enter().append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => this.color(d.group))
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)));

    node.append("title")
      .text(function (d) {
        return d.id;
      });

    this.simulation
      .nodes(this.data.nodes)
      .on("tick", ticked);

    this.simulation.force("link")
      .links(this.data.links);

    function ticked() {
      link
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });

      node
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    }
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg').attr('width', element.offsetWidth);
    this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
  }

  getGraphData(): void {
    this.dataPromise = this.updateCaseService.getGraphData();
  }

}
