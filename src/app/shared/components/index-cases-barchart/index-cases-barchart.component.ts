import {Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, ViewEncapsulation, Input} from '@angular/core';
import {Router} from '@angular/router';
import {DataService} from '../../services/data.service';
import {FilterService} from 'app/shared/services/filter.service';
import {Customer} from 'app/customer';
import {IndexCase} from 'app/index-case';
import * as d3 from 'd3';

@Component({
  selector: 'app-index-cases-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './index-cases-barchart.component.html',
  styleUrls: ['./index-cases-barchart.component.css']
})
export class IndexCasesBarchartComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() topX: number;

  private orderBy: string = 'value';
  private sortDesc: boolean = true;

  private customersPromise: Promise<Customer[]>;
  private indexCasesPromise: Promise<IndexCase[]>;
  private customers: Customer[];
  private indexCases: IndexCase[];
  private customerSubscription: any;
  private indexCaseSubscription: any;
  private sidebarSubscription: any;
  private loading: Boolean = true;
  private data: any = [];

  private svg: any;
  private margin: any = {top: 10, bottom: 10, left: 10, right: 25};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private barHeight = 40;
  private leftMargin = 150;

  constructor(private updateCaseService: DataService,
              private filterService: FilterService,
              private router: Router) {

    this.customerSubscription = filterService.customerObservable.subscribe(data => {

      this.getCustomers();

      this.customersPromise.then((customers) => {

        this.customers = customers;

        this.setData();

        this.updateChart();

      })
        .catch(err => {
          console.log(err);
        });

    });

    this.indexCaseSubscription = filterService.indexCasesObservable.subscribe(data => {

      this.getIndexCases();

      this.indexCasesPromise.then((response) => {
        this.indexCases = response;
        this.setData();
        this.updateChart();
      })
        .catch(err => {
          console.log(err);
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

        this.customers = customers;
        this.indexCases = indexCases;

        this.setData();

        this.initChart();

        this.updateChart();

        this.loading = false;
      })
      .catch(err => {
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
    this.data = [];
    let updateCases = this.updateCaseService.getRealUpdateCases(this.customers);

    // create data array
    this.indexCases.forEach(indexCase => {
      let result = updateCases.filter(updateCase => {
        return updateCase.indexCaseId === indexCase.id;
      });
      this.data.push({
        id: indexCase.id,
        label: indexCase.representative,
        updateCases: result
      });
    });

    this.data.sort(function (a, b) {
      return b["updateCases"].length - a["updateCases"].length;
    });

    if (this.topX) {
      this.data = this.data.slice(0, this.topX);
    }

  }

  initChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = this.barHeight * this.data.length + this.margin.top + this.margin.bottom;

    // d3.select(element).html('<p class="lead">Number of Updatecases</p>');

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', this.height);

    // chart area
    this.chart = this.svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // xDomain
    let xDomain: any = [0, d3.max(this.data, d => d['updateCases'].length)];
    // xScale
    this.xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, this.width - this.leftMargin]);

    this.yScale = d3.scaleBand();
  }

  updateChart() {

    let self = this;

    // Update SVG
    this.height = this.barHeight * this.data.length + this.margin.top + this.margin.bottom;
    this.svg.attr('height', this.height);

    // Scales
    this.xScale.domain([0, d3.max(this.data, d => d['updateCases'].length)]);

    this.yScale
      .domain(this.data.map(function (d) {
        return d.id;
      }))
      .rangeRound([0, this.barHeight * this.data.length])
      .paddingInner(0.1);

    let update = this.chart.selectAll('.bar')
      .data(this.data);

    // EXIT
    update.exit().remove();

    // ENTER
    let bar = update
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.id) + ')');

    bar.append("text")
      .attr('class', 'label')
      .attr("x", function (d) {
        return -10;
      })
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) {
        return d['label'];
      })
      .on('click', d => {
        this.gotoDetail(d.id)
      });

    bar.selectAll('text').call(self.wrap, self.leftMargin);


    bar.append("rect")
      .attr("width", d => this.xScale(d['updateCases'].length))
      .attr("height", this.barHeight - 1);

    bar.append("text")
      .attr("x", d => this.xScale(d['updateCases'].length) - 10)
      .attr("y", this.barHeight / 2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text((d) => {
        return (this.xScale(d['updateCases'].length) < 20) ? '' : d['updateCases'].length;
      });

    // UPDATE
    update.attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.id) + ')');
    update.select('.label')
      .text(function (d) {
        return d['label'];
      });
    update.select('rect').transition().duration(300)
      .attr("width", d => this.xScale(d['updateCases'].length))
    update.select('.amount').transition().duration(300)
      .attr("x", d => this.xScale(d['updateCases'].length) - 10)
      .text((d) => {
        return (this.xScale(d['updateCases'].length) < 20) ? '' : d['updateCases'].length;
      });
  }

  resizeChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    d3.select(element).select('svg').attr('width', element.offsetWidth);
    // xDomain
    let xDomain: any = [0, d3.max(this.data, d => d['updateCases'].length)];
    // xScale
    this.xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, this.width - this.leftMargin]);

    let update = this.chart.selectAll('.bar');
    update.select('rect').attr("width", d => this.xScale(d['updateCases'].length));
    update.select('.amount')
      .attr("x", d => this.xScale(d['updateCases'].length) - 10)
      .text((d) => {
        return (this.xScale(d['updateCases'].length) < 20) ? '' : d['updateCases'].length;
      });
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

    if (this.orderBy === 'key') {
      this.data.sort((a, b) => {
        let aName = a.label.toLowerCase();
        let bName = b.label.toLowerCase();
        if (this.sortDesc) {
          return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        } else {
          return ((bName < aName) ? -1 : ((bName > aName) ? 1 : 0));
        }
      });
    } else {
      this.data.sort((a, b) => {
        if (this.sortDesc) {
          return b["updateCases"].length - a["updateCases"].length;
        } else {
          return a["updateCases"].length - b["updateCases"].length;
        }
      });
    }

    this.yScale.domain(this.data.map(function (d) {
      return d.id;
    }));

    this.chart.selectAll(".bar")
      .transition()
      .duration(300)
      .attr('transform', (d, i) => 'translate(' + this.leftMargin + ',' + this.yScale(d.id) + ')');
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
