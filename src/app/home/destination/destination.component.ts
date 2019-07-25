import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as d3Queue from 'd3-queue';
import * as topojson from 'topojson';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss']
})
export class DestinationComponent implements OnInit {

  constructor (private http: HttpClient) {}

  ngOnInit() {
    this.showDestinationGraph();
  }

  showDestinationGraph(){
      var width = 960,
      height = 500;

      var proj = d3.geoOrthographic()
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .scale(220);

      var sky = d3.geoOrthographic()
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .scale(300);

      var path = d3.geoPath().projection(proj).pointRadius(2);


      // var zoom = d3.drag.zoom().scaleExtent([1, 2]).on("zoom", zoomed);

      // function zoomed() {
      // svg.attr("transform",
      //     "translate(" + zoom.translate() + ")" +
      //     "scale(" + zoom.scale() + ")"
      // );
      // }

      var swoosh = d3.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .curve(d3.curveNatural);

      var links = [],
      arcLines = [];

      var svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height)
              .on("mousedown", mousedown)
              .on("mouseup", mouseup);

      d3.queue()
      .defer(d3.json, "https://raw.githubusercontent.com/d3/d3.github.com/master/world-110m.v1.json")
      .defer(d3.json, "http://localhost:4200/assets/by_destination.json")
      .await(ready);

      function ready(error, world, places) {
      var ocean_fill = svg.append("defs").append("radialGradient")
          .attr("id", "ocean_fill")
          .attr("cx", "75%")
          .attr("cy", "25%");
        ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#fff");
        ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#ababab");

      var globe_highlight = svg.append("defs").append("radialGradient")
          .attr("id", "globe_highlight")
          .attr("cx", "75%")
          .attr("cy", "25%");
        globe_highlight.append("stop")
          .attr("offset", "5%").attr("stop-color", "#ffd")
          .attr("stop-opacity","0.6");
        globe_highlight.append("stop")
          .attr("offset", "100%").attr("stop-color", "#ba9")
          .attr("stop-opacity","0.2");

      var globe_shading = svg.append("defs").append("radialGradient")
          .attr("id", "globe_shading")
          .attr("cx", "55%")
          .attr("cy", "45%");
        globe_shading.append("stop")
          .attr("offset","30%").attr("stop-color", "#fff")
          .attr("stop-opacity","0")
        globe_shading.append("stop")
          .attr("offset","100%").attr("stop-color", "#505962")
          .attr("stop-opacity","0.3")

      var drop_shadow = svg.append("defs").append("radialGradient")
          .attr("id", "drop_shadow")
          .attr("cx", "50%")
          .attr("cy", "50%");
        drop_shadow.append("stop")
          .attr("offset","20%").attr("stop-color", "#000")
          .attr("stop-opacity",".5")
        drop_shadow.append("stop")
          .attr("offset","100%").attr("stop-color", "#000")
          .attr("stop-opacity","0")  

      svg.append("ellipse")
      .attr("cx", 440).attr("cy", 450)
      .attr("rx", proj.scale()*.90)
      .attr("ry", proj.scale()*.25)
      .attr("class", "noclicks")
      .style("fill", "url(#drop_shadow)");

      svg.append("circle")
      .attr("cx", width / 2).attr("cy", height / 2)
      .attr("r", proj.scale())
      .attr("class", "noclicks")
      .style("fill", "url(#ocean_fill)");

      svg.append("path")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land noclicks")
      .attr("d", path);

      svg.append("circle")
      .attr("cx", width / 2).attr("cy", height / 2)
      .attr("r", proj.scale())
      .attr("class","noclicks")
      .style("fill", "url(#globe_highlight)");

      svg.append("circle")
      .attr("cx", width / 2).attr("cy", height / 2)
      .attr("r", proj.scale())
      .attr("class","noclicks")
      .style("fill", "url(#globe_shading)");

      svg.append("g").attr("class","points")
        .selectAll("text").data(places.by_destination)
      .enter().append("path")
        .attr("class", "point")
        .attr("d", path);

      svg.append("g").attr("class","labels")
          .selectAll("text").data(places.by_destination)
        .enter().append("text")
        .attr("class", "label")
        .text(function(d) { return d.properties.name })

      position_labels();

      // spawn links between cities as source/target coord pairs
      places.by_destination.forEach(function(a) {
      places.by_destination.forEach(function(b) {
        if (a !== b) {
          links.push({
            source: a.geometry.coordinates,
            target: b.geometry.coordinates
          });
        }
      });
      });

      // build geoJSON features from links array
      links.forEach(function(e,i,a) {
      
      var feature =   { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [e.source,e.target] }}
        arcLines.push(feature)
      })

      svg.append("g").attr("class","arcs")
      .selectAll("path").data(arcLines)
      .enter().append("path")
        .attr("class","arc")
        .attr("d",path)

     svg.append("g").attr("class","flyers")
      .selectAll("path").data(links)
      .enter().append("path")
      .attr("class","flyer")
      .attr("d", function(d) { return swoosh(flying_arc(d)) })

      refresh();
      }

      function position_labels() {
      var centerPos = proj.invert([width/2,height/2]);

      var arc = d3.arc();

      svg.selectAll(".label")
      .attr("text-anchor",function(d) {
        var x = proj(d.geometry.coordinates)[0];
        return x < width/2-20 ? "end" :
              x < width/2+20 ? "middle" :
              "start"
      })
      .attr("transform", function(d) {
        var loc = proj(d.geometry.coordinates),
          x = loc[0],
          y = loc[1];
        var offset = x < width/2 ? -5 : 5;
        return "translate(" + (x+offset) + "," + (y-2) + ")"
      })
      .style("display",function(d) {
        var d = arc.distance({source: d.geometry.coordinates, target: centerPos});
        return (d > 1.57) ? 'none' : 'inline';
      })

      }

      function flying_arc(pts) {
      var source = pts.source,
        target = pts.target;

      var mid = location_along_arc(source, target, .5);
      var result = [ proj(source),
                  sky(mid),
                  proj(target) ]
      return result;
      }



      function refresh() {
      svg.selectAll(".land").attr("d", path);
      svg.selectAll(".point").attr("d", path);

      svg.selectAll(".arc").attr("d", path)
      .attr("opacity", function(d) {
          return fade_at_edge(d)
      })

      svg.selectAll(".flyer")
      .attr("d", function(d) { return swoosh(flying_arc(d)) })
      .attr("opacity", function(d) {
        return fade_at_edge(d)
      }) 
      position_labels();
      }

      function fade_at_edge(d) {
      var centerPos = proj.invert([width/2,height/2]),
        arc = d3.geoPath.greatArc(),
        start, end;
      // function is called on 2 different data structures..
      if (d.source) {
      start = d.source, 
      end = d.target;  
      }
      else {
      start = d.geometry.coordinates[0];
      end = d.geometry.coordinates[1];
      }

      var start_dist = 1.57 - arc.distance({source: start, target: centerPos}),
        end_dist = 1.57 - arc.distance({source: end, target: centerPos});

      var fade = d3.scaleLinear().domain([-.1,0]).range([0,.1]) 
      var dist = start_dist < end_dist ? start_dist : end_dist; 

      return fade(dist)
      }

      function location_along_arc(start, end, loc) {
      var interpolator = d3.geoPath.interpolate(start,end);
      return interpolator(loc)
      }

      // modified from http://bl.ocks.org/1392560
      var m0, o0;

      function mousedown() {
      m0 = [d3.event.pageX, d3.event.pageY];
      o0 = proj.rotate();
      d3.event.preventDefault();
      }

      function mousemove() {
        if (m0) {
          var m1 = [d3.event.pageX, d3.event.pageY]
            , o1 = [o0[0] + (m1[0] - m0[0]) / 6, o0[1] + (m0[1] - m1[1]) / 6];
          o1[1] = o1[1] > 30  ? 30  :
                  o1[1] < -30 ? -30 :
                  o1[1];
          proj.rotate(o1);
          sky.rotate(o1);
          refresh();
        }
      }

      function mouseup() {
        if (m0) {
          mousemove();
          m0 = null;
      }
    }
  }

}
