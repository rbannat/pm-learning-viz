import {Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';

import {DataService} from '../../services/data.service';
import {FilterService} from 'app/shared/services/filter.service';

import {Customer} from '../../../customer';
import {IndexCase} from '../../../index-case';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-customer-multi-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'multi-bar-chart.component.html',
  styleUrls: ['multi-bar-chart.component.css']
})
export class MultiBarChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() customerId: any;

  private orderBy: string = 'value';
  private sortDesc: boolean = true;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;
  private customerSubscription: any;
  private indexCaseSubscription: any;
  private sidebarSubscription: any;
  private loading: Boolean = true;
  private data: any[];
  private customer: any;
  private indexCases: any;
  private customers: any;
  private updateCases: any;

  private margin: any = {top: 10, bottom: 10, left: 150, right: 25};
  private svg: any;
  private chart: any;
  private legend: any;
  private barGroups: any;
  private width: number;
  private height: number;
  private barGroupHeight = 60;
  private y0: any;
  private y1: any;
  private x: any;
  private z: any;
  private keys: string[];


  constructor(private updateCaseService: DataService, private router: Router, private filterService: FilterService) {
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
    ])
      .then(([customers, indexCases]) => {
        // console.log('customers', customers);
        // console.log('indexCases', indexCases);

        this.customers = customers;
        this.indexCases = indexCases;

        this.setData();

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

  ngOnDestroy() {
    this.customerSubscription.unsubscribe();
    this.indexCaseSubscription.unsubscribe();
    this.sidebarSubscription.unsubscribe();
  }

  onResize() {
    this.resizeChart();
  }

  setData() {
    this.customer = this.customers.find(customer => customer.id === this.customerId);
    this.updateCases = this.updateCaseService.getRealUpdateCases(this.customers);


    //todo: show all index cases
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

    this.data = _.filter(this.data, item => this.indexCases.some(indexCase => indexCase.id == item.key));

    // add index case name
    this.data.map(item => {
      item.label = this.indexCases.find(ic => ic.id === parseInt(item.key)).representative;
      return item;
    });

    // sort by number of total updatecases
    this.data = _.sortBy(this.data, function (el) {
      return _.sumBy(el['values'], (o) => o['value']);
    }).reverse();

    this.loading = false;
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
      .range(["#4CAF50", "#FFC107", "#F44336"])
      .domain(['NEW', 'UPDATE', 'DELETE']);

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.legend = this.chart.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .attr("class", "legend");

    this.chart.append("g")
      .attr("class", "axis y--axis");

    this.barGroups = this.chart.append("g").attr("class", "barGroups");
  }

  updateChart() {
    let self = this;

    this.y0.domain(this.data.map(function (d) {
      return d.label;
    }));

    this.y1
      .domain(this.keys)
      .rangeRound([0, self.y0.bandwidth()]);

    this.x.domain([0, d3.max(this.data, function (d) {
      return d3.max(d['values'], function (d) {
        return d['value'];
      });
    })]).nice();


    let barGroup = this.barGroups
      .selectAll("g")
      .data(this.data);

    barGroup.exit().remove();
    barGroup
      .enter().append("g")
      .attr("transform", function (d) {
        return "translate(1," + self.y0(d.label) + ")";
      })
      .attr('class', 'bars');

    barGroup.selectAll(".bars").transition()
      .attr("transform", function (d) {
        return "translate(0," + self.y0(d.label) + ")";
      });

    let bar = this.chart.selectAll(".bars").selectAll("rect")
      .attr('class', 'bar')
      .data(function (d) {
        return d.values;
      });

    bar.exit().remove();
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

    bar.transition()
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

    // Value labels
    let values = this.chart.selectAll(".bars").selectAll("text")
      .data(function (d) {
        return d.values;
      });
    values.exit().remove();
    values
      .enter().append("text")
      .attr("x", d => self.x(d.value) - 3)
      .attr("y", d => self.y1(d.key) + self.y1.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text( (d) => {
        return (self.x(d.value) - 3 > 5 ) ? d.value : '';
      });
    values.transition()
      .attr("x", d => self.x(d.value) - 3)
      .attr("y", d => self.y1(d.key) + self.y1.bandwidth() / 2)
      .text( (d) => {
        return (self.x(d.value) - 3 > 5 ) ? d.value : '';
      });

    this.chart.select(".y--axis")
      .call(d3.axisLeft(self.y0))
      .selectAll(".tick text")
      .on('click', (d, i) => {
        this.gotoDetail(parseInt(this.data[i].key))
      })
      .call(this.wrap, this.margin.left - 9);

    // add legend
    let legend = this.legend
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

    self.x.rangeRound([0, self.width - 100]);

    self.chart
      .selectAll(".bars rect")
      .attr("width", function (d) {
        return self.x(d.value);
      });

    self.chart
      .selectAll(".amount")
      .attr("x", d => self.x(d.value) - 3)
      .text( (d) => {
        return (self.x(d.value) - 3 > 5 ) ? d.value : '';
      });

    //update legend
    let legend = self.chart
      .select(".legend");
    legend.selectAll("rect")
      .attr("x", this.width - 19);
    legend.selectAll("text")
      .attr("x", this.width - 24);

  }

  wrap(text: any, width) {
    text.each(function () {
      let text = d3.select(this),
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

  changeSortOrder() {
    this.sortDesc = !this.sortDesc;
    this.change(this.orderBy);
  }

  change(event) {
    this.orderBy = event;

    // sort data
    if (this.orderBy === 'key') {
      this.data.sort((a, b) => {
        let aName = a.label.toLowerCase();
        let bName = b.label.toLowerCase();
        return ((bName < aName) ? -1 : ((bName > aName) ? 1 : 0));
      });
    } else {
      this.data = _.sortBy(this.data, (el) => {
        if (this.orderBy === 'value') {
          return _.sumBy(el['values'], (o) => o['value']);
        } else {
          let element = _.find(el['values'], (o) => o['key'] === this.orderBy.toUpperCase());
          return (element !== undefined) ? element['value'] : 0;
        }
      });
    }
    if (this.sortDesc) this.data.reverse();

    // update scale
    this.y0.domain(this.data.map(function (d) {
      return d.label;
    }));

    // update bargroups positions
    this.chart.selectAll(".bars").transition().duration(300)
      .attr("transform", d => {
        return "translate(0," + this.y0(d.label) + ")";
      });

    // update axis and labels
    this.chart.select(".y--axis")
      .call(d3.axisLeft(this.y0));

    // update label wrapping
    this.chart.selectAll(".tick text")
      .on('click', (d, i) => {
        this.gotoDetail(parseInt(this.data[i].key))
      })
      .call(this.wrap, this.margin.left - 9);
  }

  getCustomers(): void {
    this.customersPromise = this.filterService.getFilteredCustomers();
  }

  getIndexCases(): void {
    this.indexCasesPromise = this.filterService.getFilteredIndexCases();
  }

  gotoDetail(indexCaseId: number): void {
    this.router.navigate(['/index-cases', indexCaseId]);
  }


}
