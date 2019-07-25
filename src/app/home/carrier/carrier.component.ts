import { Component, ViewEncapsulation, OnInit ,AfterContentInit,ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { CarrierService } from './carrier.service';

import * as d3 from 'd3';

import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-carrier',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './carrier.component.html',
  styleUrls: ['./carrier.component.scss'],
  providers:[ CarrierService ]
})

export class CarrierComponent implements OnInit {
  title = 'app';
  radius = 10;
  response: any;
  data: any;
  offsetWidth = 1000;
  offsetHeight = 1000;
   margin = {top: 20, right: 20, bottom: 30, left: 40};
  color: any;
  pack: any;
  svg: any;
  chart: any;
  root: any;
  nodes: any;
  g: any;
  view: any;
  circle: any;
  node: any;
  
  constructor (private http: HttpClient,private CarrierService: CarrierService) {}

  ngOnInit() {
    this.loadCarrier();
  }

  loadCarrier() {
    this.CarrierService.getCarrier().subscribe((response) => {
      this.response=response;
      this.showCarrierGraph();
      console.log(this.response);
      // console.log(this.response.name);
      // console.log(this.response.children[0].name);
    });
  }

  showCarrierGraph(){
    var root=this.response;

    var svg = d3.select("svg"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var color = d3.scaleLinear()
      .domain([-1, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    var pack = d3.pack()
      .size([diameter - margin, diameter - margin])
      .padding(2);

      console.log("data"+root);

      root = d3.hierarchy(root)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) { return b.value - a.value; });

      var focus = root,
      nodes = pack(root).descendants(),
      view;

      var circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
        .style("fill", function(d) { return d.children ? color(d.depth) : null; })
        .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

      var text = g.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
        .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
        .text(function(d) { return d.data.name; })

      var node = g.selectAll("circle,text");

      svg.style("background", color(-1)).on("click", function() { zoom(root); });

      zoomTo([root.x, root.y, root.r * 2 + margin]);

      function zoom(d) {
        var focus0 = focus; focus = d;

        var transition = d3.transition()
          .duration(d3.event.altKey ? 7500 : 750)
          .tween("zoom", function(d) {
            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
            return function(t) { zoomTo(i(t)); };
          });

        transition.selectAll("text")
          .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
          .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; })
      }

      function zoomTo(v) {
        var k = diameter / v[2]; view = v;
        node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
        circle.attr("r", function(d) { return d.r * k; });
      }
  }
}