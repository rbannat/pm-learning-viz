import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';
import * as d3 from 'd3';
import * as _ from 'lodash';

// const graphData: any = {
//   "nodes": [
//     {"indexCaseId": "Myriel", "group": 1, "r": 5},
//     {"indexCaseId": "Napoleon", "group": 1, "r": 10},
//     {"indexCaseId": "Mlle.Baptistine", "group": 1, "r": 20}
//   ],
//   "links": [
//     {"source": "Napoleon", "target": "Myriel", "value": 1},
//     {"source": "Mlle.Baptistine", "target": "Myriel", "value": 8}
//   ]
// };

@Component({
  selector: 'app-forced-graph',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './forced-graph.component.html',
  styleUrls: ['./forced-graph.component.css'],
  providers: [UpdateCaseService]
})
export class ForcedGraphComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;
  private loading: Boolean = true;
  private data: any;

  private margin: any = {top: 10, bottom: 10, left: 10, right: 10};
  private chart: any;
  private width: number;
  private height: number;
  private simulation: any;
  private color: any;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {

    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ])
      .then(([customers, indexCases]) => {
        // console.log('customers', customers);
        // console.log('indexCases', indexCases);

        let updateCases = this.updateCaseService.getRealUpdateCases(customers);

        this.data = this.getGraphData(indexCases, updateCases);
        this.loading = false;

        this.initChart();
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
    this.height = 500 + this.margin.top + this.margin.bottom;

    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function (d) {
        return d['indexCaseId'];
      }).distance(100))
      .force("collide", d3.forceCollide(function (d) {
        return d['r'];
      }))
      .force("charge", d3.forceManyBody().strength(-270))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    this.color = d3.scaleOrdinal(d3.schemeCategory20);

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // add zoom
    svg.call(d3.zoom()
      .scaleExtent([1 / 2, 4])
      .on("zoom", this.zoomed.bind(this)));

    // chart area
    this.chart = svg.append('g')
      .attr('class', 'graph')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  zoomed() {
    this.chart.attr("transform", d3.event.transform);
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

    // Per-type markers, as they don't inherit styles.
    this.chart.append("defs").selectAll("marker")
      .data(["default"])
      .enter().append("marker")
      .attr("id", function (d) {
        return d;
      })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 3)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "arrowHead");

    let path = this.chart.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(this.data.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("marker-end", "url(#default)")
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
        return d.title;
      });

    let labels = this.chart.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(this.data.nodes)
      .enter().append("text")
      .text(function (d) {
        return d.indexCaseId;
      });

    this.simulation
      .nodes(this.data.nodes)
      .on("tick", ticked);

    this.simulation.force("link")
      .links(this.data.links);

    function ticked() {
      path.attr("d", linkArc);

      node
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });

      labels
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y + 3;
        });
    }

    function linkArc(d) {

      // Total difference in x and y from source to target
      let dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);

      // Length of path from center of source node to center of target node
      let pathLength = Math.sqrt((dx * dx) + (dy * dy));

      // x and y distances from center to outside edge of target node
      let offsetX = (dx * d.target.r) / pathLength;
      let offsetY = (dy * d.target.r) / pathLength;

      // x and y distances from center to outside edge of source node
      let offsetXS = (dx * d.source.r) / pathLength;
      let offsetYS = (dy * d.source.r) / pathLength;
      return "M" + (d.source.x + offsetXS) + "," + (d.source.y + offsetYS) + "A" + dr + "," + dr + " 0 0,1 " + (d.target.x - offsetX) + "," + (d.target.y - offsetY);
    }
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg').attr('width', element.offsetWidth);
    this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
  }

  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

  getGraphData(indexCases: IndexCase[], updateCases: any[]): any {
    let graphData = {
      nodes: [],
      links: []
    };

    // count indexCases for ALL updatecases
    let indexCaseCounts = _.countBy(updateCases, 'indexCaseId');

    // filter UPDATEs
    let updates = _.filter(updateCases, uc => uc.updateType === 'UPDATE');

    // only create links for nodes where indexCase exists
    updates = _.filter(updates, uc => {
      let target = _.find(indexCases, ic => ic.id === uc.indexCaseId);
      let source = _.find(indexCases, ic => ic.id === uc.source);
      return typeof source !== 'undefined' && typeof target !== 'undefined';
    });

    // store nodes with updates
    let targetNodes = _.uniqBy(updates, 'indexCaseId').map(item => {
        return {
          indexCaseId: item.indexCaseId,
          title: _.find(indexCases, ic => item.indexCaseId === ic.id)['representative'],
          r: (indexCaseCounts[item.indexCaseId]) ? Math.sqrt(indexCaseCounts[item.indexCaseId]) * 3 + 5 : 5,
          group: 1
        }
      }
    );
    let sourceNodes = _.uniqBy(updates, 'source').map(item => {
        return {
          indexCaseId: item.source,
          title: _.find(indexCases, ic => item.indexCaseId === ic.id)['representative'],
          r: (indexCaseCounts[item.source]) ? Math.sqrt(indexCaseCounts[item.source]) * 3 + 5 : 5,
          group: 1
        }
      }
    );

    graphData.nodes = _.unionBy(targetNodes, sourceNodes, 'indexCaseId');

    // create links
    let links = [];
    _.each(updates, item => {

      if (!_.some(links, {
          'indexCaseId': item.indexCaseId,
          'source': item.source
        }) || !_.some(links, {'indexCaseId': item.source, 'source': item.indexCaseId})) {
        links.push(item);
      }
    });

    links = _.map(links, link => {
      return {
        source: link.source,
        target: link.indexCaseId,
        value: _.filter(updates, item => item.indexCaseId === link.indexCaseId && item.source === link.source).length
      }
    });
    graphData.links = links;

    return graphData;
  }

}
