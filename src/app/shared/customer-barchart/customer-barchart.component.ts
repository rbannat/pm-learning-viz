import {Component, OnInit, ViewEncapsulation, Input} from '@angular/core';
import {UpdateCaseService} from 'app/shared/update-case.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-customer-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './customer-barchart.component.html',
  styleUrls: ['./customer-barchart.component.css'],
  providers: [UpdateCaseService]
})
export class CustomerBarchartComponent implements OnInit {

  @Input() topX: number;
  data: any;
  loading: Boolean = true;

  constructor(private updateCaseService: UpdateCaseService) {
  }

  ngOnInit() {
    let self = this;

    self.getCustomers();
    self.data.then((response) => {
      let data = response;

      data.sort(function (a, b) {
        return b["updateCaseCount"] - a["updateCaseCount"];
      });

      if (self.topX) {
        data = data.slice(0, self.topX);
      }

      self.loading = false;

      self.initChart(data);
    });
  }

  initChart(data) {
    let width = document.querySelectorAll('.d3-customer-barchart')[0].clientWidth,
      barHeight = 20,
      leftMargin = 100;

    let chart = d3.select('.d3-customer-barchart');
    chart.html('<p class="lead">Number of Updatecases</p>');

    let svg = chart.append('svg')
      .attr('width', width)
      .attr('height', barHeight * data.length);

    //xscale
    let xScale = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) {
        return d['updateCaseCount'];
      })])
      .range([0, width - leftMargin]);

    // radius scale
    // var rScale = d3.scale.sqrt()
    // .domain([52070, 1380000000])
    // .range([10,40]);

    let bar = svg.selectAll('g')
      .data(data)
      .enter().append('g')
      .attr('transform', function (d, i) {
        return 'translate(' + leftMargin + ',' + i * barHeight + ')';
      });
    bar.append("text")
      .attr('class', 'label')
      .attr("x", function (d) {
        return -10;
      })
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .text(function (d) {
        return d['customer'];
      });

    bar.append("rect")
      .attr("width", function (d) {
        return xScale(d['updateCaseCount']);
      })
      .attr("height", barHeight - 1);

    bar.append("text")
      .attr("x", function (d) {
        return xScale(d['updateCaseCount']) - 3;
      })
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .attr('class', 'amount')
      .text(function (d) {
        return (d['updateCaseCount'] < 5) ? '' : d['updateCaseCount'];
      });

  }

  getCustomers(): void {
    this.data = this.updateCaseService.getCustomers();
  }

}
