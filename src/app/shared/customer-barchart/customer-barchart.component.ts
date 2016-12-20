import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-customer-barchart',
  templateUrl: './customer-barchart.component.html',
  styleUrls: ['./customer-barchart.component.css']
})
export class CustomerBarchartComponent implements OnInit {

  loading = true;

  constructor() {
  }

  ngOnInit() {
    var self = this;

    d3.json("assets/customer-list.json", function (error, data) {
      if (error) {
        self.loading = false;
        return console.warn(error);
      } else {
        self.loading = false;
        console.log(data);
        // data.sort(function (a, b) {
        //   return b["updateCaseCount"] - a["updateCaseCount"];
        // });
        self.initChart(data);
      }
    });
  }

  initChart(data) {
    let width = document.querySelectorAll('.d3-customer-barchart')[0].clientWidth,
      barHeight = 20,
      leftMargin = 100;

    let chart = d3.select('.chart');
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
      .text(function (d) {
        return (d['updateCaseCount'] < 5) ? '' : d['updateCaseCount'];
      });

  }

}
