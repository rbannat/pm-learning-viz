import {Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import {DataService} from '../../services/data.service';
import {ColorsService} from 'app/shared/services/colors.service';
import {FilterService} from 'app/shared/services/filter.service';
import {Customer} from '../../../customer';
import {IndexCase} from '../../../index-case';
import * as d3 from 'd3';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as _ from 'lodash';

@Component({
  selector: 'app-customers-ic-table',
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'heatmap-matrix.component.html',
  styleUrls: ['heatmap-matrix.component.css']
})
export class HeatmapMatrixComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('chart') private chartContainer: ElementRef;

  private customersPromise: Promise<any>;
  private customers: Customer[];
  private indexCasesPromise: Promise<any>;
  private customerSubscription: any;
  private indexCaseSubscription: any;
  private sidebarSubscription: any;
  private indexCases: IndexCase[];
  private loading: boolean = true;
  private actionTypeColor: string = 'unknown';

  public orderBy: any = 'custcat';
  private margin: any = {top: 100, bottom: 10, left: 150, right: 75};
  private cellSize: number = 18;
  private legendElementWidth: number;
  private chart: any;
  private rowLabels: any;
  private colLabels: any;
  private heatMap: any;
  private width: number;
  private height: number;
  private svg: any;
  private rowSortOrder: boolean;
  private colSortOrder: boolean;
  private selectedLabel: string;

  private updateCases: any;
  private matrixData: any[];
  private colors: string[];
  private colorScale: any;

  constructor(private updateCaseService: DataService,
              private colorsService: ColorsService,
              private filterService: FilterService) {

    this.customerSubscription = filterService.customerObservable.subscribe(data => {
      this.getCustomers();
      this.customersPromise.then((response) => {
        this.customers = response;
        this.updateCases = this.updateCaseService.getRealUpdateCases(response);
        this.setData();
        this.updateChart();
      });

    });

    this.indexCaseSubscription = filterService.indexCasesObservable.subscribe(data => {
      this.getIndexCases();
      this.indexCasesPromise.then((response) => {
        this.indexCases = response;
        this.setData();
        this.updateChart();
      });

    });

    this.sidebarSubscription = filterService.sidebarObservable.subscribe(data => {
      this.resizeChart();
    });

  }

  ngOnInit() {
    this.getCustomers();
    this.getIndexCases();

    Promise.all<Customer[], IndexCase[]>([
      this.customersPromise,
      this.indexCasesPromise,
    ]).then(([customers, indexCases]) => {

      this.customers = customers;
      this.indexCases = indexCases;

      this.setData();

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

  ngOnDestroy() {
    this.customerSubscription.unsubscribe();
    this.indexCaseSubscription.unsubscribe();
    this.sidebarSubscription.unsubscribe();
  }

  onResize() {
    this.resizeChart();
  }

  setData() {
    this.customers = this.customers.map(customer => {
      let customerObj = customer;
      customerObj.label = customer['customer'];
      return customerObj;
    });

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
    this.updateCases = this.updateCaseService.getRealUpdateCases(this.customers);
    this.indexCases = this.indexCases.sort(function (a, b) {
      let nameA = a.representative.toUpperCase(); // ignore upper and lowercase
      let nameB = b.representative.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    });

    this.matrixData = this.getMatrixData();
  }

  initChart() {

    let self = this;
    let element = this.chartContainer.nativeElement;
    this.width = this.cellSize * this.customers.length;
    this.height = this.cellSize * this.indexCases.length;
    this.legendElementWidth = this.cellSize * 2.5;

    this.colors = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];

    this.colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateBlues)
      .domain([0, d3.max(this.matrixData, d => d.value)]);

    this.svg = d3.select(element).append('svg')
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.chart = this.svg
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.rowLabels = this.chart.append("g").attr("class", "rowLabels");
    this.colLabels = this.chart.append("g").attr("class", "colLabels");
    this.heatMap = this.chart.append("g").attr("class", "heatMap").attr("class", "g3");

    this.chart.append("text")
      .attr("class", "label")
      .attr("x", this.width + 20)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text("Count");
  }

  updateChart() {
    // add new bars
    this.rowSortOrder = true;
    this.colSortOrder = true;

    let self = this;


    let rowLabels = this.rowLabels
      .selectAll("text")
      .data(this.indexCases);

    rowLabels.exit().remove();

    rowLabels
      .enter()
      .append("text")
      .text(function (d) {
        if (d.representative.length > 25)
          return d.representative.substring(0, 25) + '...';
        else
          return d.representative;
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
        if (self.selectedLabel === 'r' + i) self.rowSortOrder = !self.rowSortOrder;
        self.selectedLabel = 'r' + i;
        self.sortbylabel("r", i, self.rowSortOrder);
        self.orderBy = 'custom';
        d3.select("#order").property('value', 'custom');
      });

    rowLabels.transition()
      .attr("y", (d, i) => {
        return (i ) * this.cellSize;
      })
      .attr("class", function (d, i) {
        return "rowLabel mono r" + i;
      })
      .text(function (d) {
        if (d.representative.length > 25)
          return d.representative.substring(0, 25) + '...';
        else
          return d.representative;
      });


    let colLabels = this.colLabels
      .selectAll("text")
      .data(this.customers);

    colLabels.exit().remove();

    colLabels
      .enter()
      .append("text")
      .text(function (d) {
        return d.label;
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
        if (self.selectedLabel === 'c' + i) self.colSortOrder = !self.colSortOrder;
        self.selectedLabel = 'c' + i;
        self.orderBy = 'custom';
        d3.select("#order").property('value', 'custom');
        self.sortbylabel("c", i, self.colSortOrder);
      });

    colLabels.transition()
      .text(function (d) {
        return d.label;
      })
      .attr("y", (d, i) => {
        return (i ) * this.cellSize;
      })
      .attr("class", function (d, i) {
        return "colLabel mono c" + i;
      });

    let heatMap = this.heatMap
      .selectAll("rect")
      .data(this.matrixData);

    heatMap.exit().remove();

    heatMap
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
          .style("top", (parseInt(d3.select(this).attr('y')) + self.margin.top - self.margin.top) + "px");

        self.actionTypeColor = self.colorsService.getColor(self.indexCases[d.row].type);

        tooltip.select("#customer")
          .text("Customer: " + self.customers[d.col].label);

        tooltip.select("#category")
          .text("Index Case: " + self.indexCases[d.row].representative);

        tooltip.select("#action-type")
          .text(self.indexCases[d.row].type);

        tooltip.select("#topic")
          .text(a => {
            if (self.indexCases[d['row']].topic !== undefined) {
              return "Topic: " + self.indexCases[d['row']].topic
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
      });

    heatMap.transition()
      .attr("x", (d) => {
        return d.col * this.cellSize;
      })
      .attr("y", (d) => {
        return d.row * this.cellSize;
      })
      .attr("class", function (d) {
        return "cell cell-border cr" + (d.row) + " cc" + (d.col);
      })
      .style("fill", (d) => (d.value !== 0) ? this.colorScale(d.value) : '#ffffff');

    // Add a legend for the color values.
    let legend = this.chart.selectAll(".legend")
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
  }

  resizeChart() {
  }

  // Change ordering of cells
  sortbylabel(rORc, i, sortOrder) {
    let t = this.chart.transition().duration(1000);
    let log2r: any[] = [];
    let sorted; // sorted is zero-based index

    d3.selectAll(".c" + rORc + i).each(function (d) {
      return log2r.push(d['value'])
    });

    if (rORc == "r") { // sort log2ratio of a indexCase
      sorted = d3.range(this.customers.length).sort(function (a, b) {
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
    } else { // sort log2ratio of a customer
      sorted = d3.range(this.indexCases.length).sort(function (a, b) {
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
      let t = this.chart.transition().duration(1000);
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
      let t = this.chart.transition().duration(1000);
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

    } else if (value == "cat") {
      let t = this.chart.transition().duration(1000);
      t.selectAll(".cell")
        .attr("y", (d) => {
          return (d.row) * this.cellSize;
        });

      t.selectAll(".rowLabel")
        .attr("y", (d, i) => {
          return i * this.cellSize;
        });
    }
  }

  getCustomers(): void {
    this.customersPromise = this.filterService.getFilteredCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.filterService.getFilteredIndexCases();
  }

  getMatrixData(): any[] {
    let matrixData = [];

    // filter no updatecases
    this.customers = _.filter(this.customers, customer => {
      return _.some(this.updateCases, uc => uc['customerId'] == customer['id']);
    });
    this.indexCases = _.filter(this.indexCases, ic => {
      return _.some(this.updateCases, uc => uc['indexCaseId'] === ic['id']);
    });

    let categoriesLength = this.indexCases.length;
    let customersLength = this.customers.length;
    for (let i = 0; i < categoriesLength; i++) {
      for (let j = 0; j < customersLength; j++) {
        matrixData.push({
          row: i,
          col: j,
          value: _.filter(this.updateCases, updateCase => updateCase['indexCaseId'] === this.indexCases[i].id && updateCase['customerId'] === this.customers[j].id).length
        });
      }
    }
    return matrixData;
  }

}
