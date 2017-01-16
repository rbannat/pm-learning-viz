import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';
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
  @Input() indexCaseId: number;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;
  private indexCases: IndexCase[];
  private updateCases: any[];
  private loading: Boolean = true;
  private data: any;
  private nodes:any;

  private margin: any = {top: 10, bottom: 10, left: 10, right: 10};
  private chart: any;
  private width: number;
  private height: number;
  private simulation: any;
  private color: any;

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
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .alphaTarget(1);

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

    // marker container
    this.chart.append("defs");

    // paths container
    this.chart.append("g")
      .attr("class", "links");

    // nodes container
    this.chart.append("g")
      .attr("class", "nodes");

    // labels container
    this.chart.append("g")
      .attr("class", "labels");
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

    let self = this,
      updateCases = this.updateCases;

    if (this.indexCaseId !== undefined) {
      updateCases = _.filter(updateCases, uc => uc.indexCaseId === this.indexCaseId || uc.source === this.indexCaseId);
    }

    this.data = this.getGraphData(this.indexCases, updateCases);

    // Markers
    let markers = this.chart.select('defs').selectAll("marker")
      .data(["default"]);
    markers.exit().remove();
    markers
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
    markers
      .attr("id", function (d) {
        return d;
      });

    // Nodes
    let nodes = this.chart.select('.nodes').selectAll('circle')
      .data(self.data.nodes);
    nodes.exit().remove();
    nodes
      .enter().append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => this.color(d.group))
      .on('click', d => {
        this.gotoDetail(d.indexCaseId)
      })
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)))
      .append("title")
      .text(function (d) {
        return d.title;
      });
    nodes
      .attr("r", d => d.r)
      .attr("fill", d => this.color(d.group))
      .on('click', d => {
        this.gotoDetail(d.indexCaseId)
      })
      .select('title')
      .text(function (d) {
        return d.title;
      });
    nodes = this.chart.selectAll('circle');

    // Paths
    let paths = this.chart.select('.links').selectAll('path')
      .data(this.data.links);
    paths.exit().remove();
    paths
      .enter().append("path")
      .attr("class", "link")
      .attr("marker-end", "url(#default)")
      .merge(paths)
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value);
      });
    paths =  this.chart.selectAll('.link');

    let labels = this.chart.select('.labels').selectAll("text")
      .data(this.data.nodes);
    labels.exit().remove();
    labels
      .enter().append("text")
      .attr("dy", ".35")
      .call(self.wrap)
      .merge(labels)
      .text(function (d) {
        return d.title;
      });
    labels = this.chart.selectAll('.labels text');

    this.simulation.on("tick", ticked);
    this.simulation
      .nodes(self.data.nodes);
    this.simulation.force("link")
      .links(self.data.links);
    this.simulation.alpha(1).restart();

    function ticked() {
      paths.attr("d", linkArc);

      nodes
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
      labels.selectAll('tspan').attr('x', d => d.x);
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
          r: (indexCaseCounts[item.indexCaseId]) ? Math.sqrt(indexCaseCounts[item.indexCaseId]) * 4 + 5 : 5,
          group: 1
        }
      }
    );
    let sourceNodes = _.uniqBy(updates, 'source').map(item => {
        return {
          indexCaseId: item.source,
          title: _.find(indexCases, ic => item.source === ic.id)['representative'],
          r: (indexCaseCounts[item.source]) ? Math.sqrt(indexCaseCounts[item.source]) * 4 + 5 : 5,
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

  wrap(text: any) {
    text.each(function () {
      let text: any = d3.select(this),
        width = Math.max(this.__data__.r * 2, 100),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan: any = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }

      //vertical align center
      if (lineNumber > 0) {
        text.selectAll('tspan').each(function () {
          let tspan = d3.select(this);
          let dy = parseFloat(tspan.attr("dy"));
          tspan.attr('dy', dy - (lineNumber) / 2 * lineHeight + "em");
        });
      }
    });
  }

  gotoDetail(indexCaseId: number): void {
    this.router.navigate(['/index-cases', indexCaseId]);
  }

}
