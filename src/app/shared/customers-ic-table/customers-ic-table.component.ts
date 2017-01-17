import {Component, OnInit, OnChanges, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import {ColorsService} from 'app/shared/colors.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';
import * as d3 from 'd3';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as _ from 'lodash';

@Component({
  selector: 'app-customers-ic-table',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './customers-ic-table.component.html',
  styleUrls: ['./customers-ic-table.component.css'],
  providers: [UpdateCaseService, ColorsService]
})
export class CustomersIcTableComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;

  private customersPromise: Promise<any>;
  private customers: Customer[];
  private indexCasesPromise: Promise<any>;
  private indexCases: IndexCase[];
  private loading: boolean = true;
  private actionTypeColor:string = 'unknown';

  public orderBy: any = 'custcat';
  private margin: any = {top: 50, bottom: 10, left: 100, right: 75};
  private cellSize: number = 10;
  private legendElementWidth: number;
  private chart: any;
  private width: number;
  private height: number;
  private svg: any;
  private rowSortOrder: boolean;
  private colSortOrder: boolean;
  private selectedLabel: any;

  updateCases: any;
  categories: any;
  matrixData: any[];
  colors: string[];
  colorScale: any;

  constructor(private updateCaseService: UpdateCaseService,
              private colorsService: ColorsService) {
  }

  ngOnInit() {
    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ]).then(([customers, indexCases]) => {

      this.customers = customers.map(customer => {
        let customerObj = customer;
        customerObj.label = customer['customer'];
        return customerObj;
      });
      this.indexCases = indexCases;

      this.customers = this.customers.sort(function (a, b) {
        let nameA = a.label.toUpperCase(); // ignore upper and lowercase
        let nameB = b.label.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });
      this.updateCases = this.updateCaseService.getRealUpdateCases(customers);
      this.categories = indexCases.sort((a, b) => a.id - b.id);

      this.matrixData = this.getMatrixData();

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

    let self = this;
    let element = this.chartContainer.nativeElement;
    this.width = this.cellSize * this.categories.length;
    this.height = this.cellSize * this.customers.length;
    this.legendElementWidth = this.cellSize * 2.5;

    this.colors = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];

    this.colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateBlues)
      .domain([0, d3.max(this.matrixData, d => d.value)]);

    this.svg = d3.select(element).append('svg')
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  updateChart() {

    // add new bars
    this.rowSortOrder = true;
    this.colSortOrder = true;

    let self = this;

    let rowLabels = this.svg.append("g")
      .selectAll(".rowLabelg")
      .data(this.customers)
      .enter()
      .append("text")
      .text(function (d) {
        return d.label;
      })
      .attr("x", 0)
      .attr("y", (d, i) => {
        return (i ) * this.cellSize;
      })
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + this.cellSize / 1.5 + ")")
      .attr("class", function (d, i) {
        return "rowLabel mono r" + i;
      })
      .on("mouseover", function (d) {
        d3.select(this).classed("text-hover", true);
      })
      .on("mouseout", function (d) {
        d3.select(this).classed("text-hover", false);
      })
      .on("click", function (d, i) {
        if (this.selectedLabel === 'r' + i) self.rowSortOrder = !self.rowSortOrder;
        this.selectedLabel = 'r' + i;
        self.sortbylabel("r", i, self.rowSortOrder);
        this.orderBy = 'custom';
        d3.select("#order").property('value', 'custom');
      });

    let colLabels = this.svg.append("g")
        .selectAll(".colLabelg")
        .data(this.categories)
        .enter()
        .append("text")
        .text(function (d) {
          return d.id;
        })
        .attr("x", 0)
        .attr("y", (d, i) => {
          return (i ) * this.cellSize;
        })
        .style("text-anchor", "left")
        .attr("transform", "translate(" + this.cellSize / 2 + ",-6) rotate (-90)")
        .attr("class", function (d, i) {
          return "colLabel mono c" + i;
        })
        .on("mouseover", function (d) {
          d3.select(this).classed("text-hover", true);
        })
        .on("mouseout", function (d) {
          d3.select(this).classed("text-hover", false);
        })
        .on("click", function (d, i) {
          if (this.selectedLabel === 'c' + i) self.colSortOrder = !self.colSortOrder;
          this.selectedLabel = 'c' + i;
          this.orderBy = 'custom';
          d3.select("#order").property('value', 'custom');
          self.sortbylabel("c", i, self.colSortOrder);
        })
      ;

    let heatMap = this.svg.append("g")
        .attr("class", "g3")
        .selectAll(".cellg")
        .data(this.matrixData)
        .enter()
        .append("rect")
        .attr("x", (d) => {
          return d.col * this.cellSize;
        })
        .attr("y", (d) => {
          return d.row * this.cellSize;
        })
        .attr("class", function (d) {
          return "cell cell-border cr" + (d.row) + " cc" + (d.col);
        })
        .attr("width", this.cellSize)
        .attr("height", this.cellSize)
        .style("fill", (d) => (d.value !== 0) ? this.colorScale(d.value) : '#ffffff')
        .on("mouseover", function (d) {
          //highlight text
          d3.select(this).classed("cell-hover", true);
          d3.selectAll(".rowLabel").classed("text-highlight", function (r, ri) {
            return ri == (d.row);
          });
          d3.selectAll(".colLabel").classed("text-highlight", function (c, ci) {
            return ci == (d.col);
          });

          //Update the tooltip position and value
          let tooltip = d3.select("#tooltip")
            .style("left", (parseInt(d3.select(this).attr('x')) + self.margin.left + self.cellSize * 2) + "px")
            .style("top", (parseInt(d3.select(this).attr('y')) + self.margin.top + self.cellSize * 2) + "px");

          self.actionTypeColor = self.colorsService.getColor(self.categories[d.col].type);

          tooltip.select("#customer")
            .text("Customer: " + self.customers[d.row].label);

          tooltip.select("#category")
            .text("Index Case: " + self.categories[d.col].representative);

          tooltip.select("#action-type")
            .text(self.categories[d.col].type);

          tooltip.select("#topic")
            .text(a => {
              if (self.categories[d['col']].topic !== undefined) {
                return "Topic: " + self.categories[d['col']].topic
              } else {
                return "Topic: " + 'No Topic';
              }
            });

          tooltip.select("#count")
            .text("Count:" + d.value);

          //Show the tooltip
          tooltip.classed("hidden", false);
        })
        .on("mouseout", function () {
          d3.select(this).classed("cell-hover", false);
          d3.selectAll(".rowLabel").classed("text-highlight", false);
          d3.selectAll(".colLabel").classed("text-highlight", false);
          d3.select("#tooltip").classed("hidden", true);
        })
      ;

    // Add a legend for the color values.
    let legend = this.svg.selectAll(".legend")
      .data(this.colorScale.ticks(6).slice(1).reverse())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => {
        return "translate(" + (this.width + 20) + "," + (20 + i * 20) + ")";
      });

    legend.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", this.colorScale);

    legend.append("text")
      .attr("x", 26)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text(String);

    this.svg.append("text")
      .attr("class", "label")
      .attr("x", this.width + 20)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text("Count");

  }

  resizeChart() {
  }

  // Change ordering of cells

  sortbylabel(rORc, i, sortOrder) {
    let t = this.svg.transition().duration(2000);
    let log2r: any[] = [];
    let sorted; // sorted is zero-based index

    d3.selectAll(".c" + rORc + i).each(function (d) {
      return log2r.push(d['value'])
    });

    if (rORc == "r") { // sort log2ratio of a customer
      sorted = d3.range(this.categories.length).sort(function (a, b) {
        if (sortOrder) {
          return log2r[b] - log2r[a];
        } else {
          return log2r[a] - log2r[b];
        }
      });
      t.selectAll(".cell")
        .attr("x", (d) => {
          return sorted.indexOf(d.col) * this.cellSize;
        })
      ;
      t.selectAll(".colLabel")
        .attr("y", (d, i) => {
          return sorted.indexOf(i) * this.cellSize;
        })
      ;
    } else { // sort log2ratio of a category
      sorted = d3.range(this.customers.length).sort(function (a, b) {
        if (sortOrder) {
          return log2r[b] - log2r[a];
        } else {
          return log2r[a] - log2r[b];
        }
      });
      t.selectAll(".cell")
        .attr("y", (d) => {
          return sorted.indexOf(d.row) * this.cellSize;
        })
      ;
      t.selectAll(".rowLabel")
        .attr("y", (d, i) => {
          return sorted.indexOf(i) * this.cellSize;
        })
      ;
    }
  }

  order(value) {
    this.orderBy = value;
    if (value == "custcat") {
      let t = this.svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("x", (d) => {
          return (d.col) * this.cellSize;
        })
        .attr("y", (d) => {
          return (d.row) * this.cellSize;
        });

      t.selectAll(".rowLabel")
        .attr("y", (d, i) => {
          return i * this.cellSize;
        });

      t.selectAll(".colLabel")
        .attr("y", (d, i) => {
          return i * this.cellSize;
        });

    } else if (value == "cust") {
      let t = this.svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("y", (d) => {
          return (d.row) * this.cellSize;
        });

      t.selectAll(".rowLabel")
        .attr("y", (d, i) => {
          return i * this.cellSize;
        });
    } else if (value == "cat") {
      var t = this.svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("x", (d) => {
          return (d.col) * this.cellSize;
        })
      ;
      t.selectAll(".colLabel")
        .attr("y", (d, i) => {
          return i * this.cellSize;
        })
      ;
    }
  }

  getCustomers(): void {
    this.customersPromise = this.updateCaseService.getCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.updateCaseService.getIndexCases();
  }

  getMatrixData(): any[] {
    let matrixData = [];

    // filter no updatecases
    this.customers = _.filter(this.customers, customer => {
      return _.some(this.updateCases, uc => uc['customerId'] == customer['id']);
    });
    this.categories = _.filter(this.categories, ic => {
      return _.some(this.updateCases, uc => uc['indexCaseId'] === ic['id']);
    });

    let customersLength = this.customers.length;
    let categoriesLength = this.categories.length;
    for (let i = 0; i < customersLength; i++) {
      for (let j = 0; j < categoriesLength; j++) {
        matrixData.push({
          row: i,
          col: j,
          value: _.filter(this.updateCases, updateCase => updateCase['customerId'] === this.customers[i].id && updateCase['indexCaseId'] === this.categories[j].id).length
        });
      }
    }
    return matrixData;
  }

}
