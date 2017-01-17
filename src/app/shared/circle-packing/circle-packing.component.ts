import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {ColorsService} from 'app/shared/colors.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-circle-packing',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './circle-packing.component.html',
  styleUrls: ['./circle-packing.component.css'],
  providers: [UpdateCaseService, ColorsService]
})
export class CirclePackingComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() indexCaseId: number;

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

  constructor(private updateCaseService: UpdateCaseService, private router: Router, private colorsService: ColorsService) {
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

        // transform data
        let nestedData = d3.nest()
          .key(function (d) {
            return d['topic'];
          })
          .key(function (d) {
            return d['type'];
          })
          .entries(this.indexCases);

        this.data = {
          'name': 'root',
          'children': nestedData.map(topic => {
            return {
              'name': topic.key, 'children': topic.values.map(actionType => {
                return {
                  'name': actionType.key, 'children': actionType.values.map(indexCase => {
                    return {
                      'name': indexCase.representative,
                      'size': _.filter(this.updateCases, uc => uc.indexCaseId === indexCase.id).length,
                      'id': indexCase.id
                    }
                  }).filter(ic => ic.size !== 0)
                }
              })
            }
          })
        };

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
      .attr("height", this.height + this.margin.top + this.margin.bottom);
    this.chart = this.svg
      .append("g")
      .attr("transform", "translate(" + this.diameter / 2 + "," + this.diameter / 2 + ")");

    this.color = d3.scaleLinear<any>()
      .domain([-1, 5])
      .range(["#90CAF9", "#1565C0"])
      .interpolate(d3.interpolateRgb);

    this.pack = d3.pack()
      .size([this.diameter - this.margin.left, this.diameter - this.margin.right])
      .padding(2);
  }

  updateChart() {

    let self = this;

    this.data = d3.hierarchy(this.data)
      .sum(function (d) {
        return d.size;
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    let focus = this.data,
      nodes = this.pack(this.data).descendants(),
      view;

    let circle = this.chart.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("class", function (d) {
        return d['parent'] ? d.children ? "node" : "node node--leaf" : "node node--root";
      })
      .style("fill", d => {
        if (d.depth === 2) {
          return this.colorsService.getHexColor(d.data.name);
        } else {
          return d.children ? this.color(d.depth) : null;
        }
      })
      .on("click", function (d) {
        if(d.depth === 3){
          self.gotoDetail(d.data.id);
          d3.event.stopPropagation();
        } else {
          if (focus !== d) zoom(d), d3.event.stopPropagation();
        }
      });

    let text = this.chart.selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", d => {
        return d['parent'] === this.data ? 1 : 0;
      })
      .text(function (d) {
        return d.data.name;
      })
      .attr("dy", "0");

    this.chart.selectAll('text').call(self.wrap);

    this.chart.selectAll('text')
      .style("display", d => {
        return d['parent'] === this.data ? "inline" : "none";
      });

    let node = this.chart.selectAll("circle,text");

    this.svg
      .on("click", () => {
        zoom(this.data);
      });

    zoomTo([this.data.x, this.data.y, this.data.r * 2 + this.margin.left]);

    function zoom(d) {
      let focus0 = focus;
      focus = d;

      let transition: any = d3.transition(null)
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + self.margin.left]);
          return function (t) {
            zoomTo(i(t));
          };
        });

      transition.selectAll('text')
        .filter(function (d) {
          return d['parent'] === focus || this.style.display === "inline";
        })
        .style("fill-opacity", function (d) {
          return d['parent'] === focus ? 1 : 0;
        })
        .on("start", function (d) {
          if (d['parent'] === focus) this.style.display = "inline";
        })
        .on("end", function (d) {
          if (d['parent'] !== focus) this.style.display = "none";
        });

      transition.selectAll('circle')
        .filter(function (d) {
          return d['parent'] === focus && focus.depth === 2;
        })
        .style("pointer-events", function (d) {
          return d['parent'] === focus ? 'all' : 'none';
        });
    }

    function zoomTo(v) {
      let k = self.diameter / v[2];
      view = v;
      node.attr("transform", function (d) {
        return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
      });
      circle.attr("r", function (d) {
        return d.r * k;
      });
    }
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.diameter = this.width;

    d3.select(element).select('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetWidth);

    this.pack
      .size([this.diameter - this.margin.left, this.diameter - this.margin.right])
      .padding(2);
  }

  wrap(text: any) {
    text.each(function () {
      let text: any = d3.select(this),
        width = this.__data__.r * 2,
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = 0,
        x = 0,
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

  gotoDetail(indexCaseId: number): void {
    this.router.navigate(['/index-cases', indexCaseId]);
  }

}