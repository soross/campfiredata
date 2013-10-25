// totals
// word_tree
// rankings
// days

var minDate, maxDate, totalDays;

$.ajax({
  type: "GET",
  url: "data/rankings"
}).done(function(res) {
  // console.log(res)

  // var day = res.data[0].date
  // var jsDay = new Date(day)
  // console.log(jsDay)

});


drawTotals();
drawDayChart();
drawBubblemap();
var rankings = new Rankings();
// drawTreemap();




// RANKINGS
// ~~~~~~~~~~~~~~~~~~~!


function Rankings(){
  this.data = null;
  this.plotData = null;
  this.width = 960;
  this.height = 400;
  this.$domRef = $('#rankings');
  this.category = this.$domRef.find('select').val();

  this.containerDiv = null

  var that = this;
  d3.json("data/rankings", function(error, json) {
    console.log(json)
    that.data = json.data;
    that.sortData();
    that.handleEvents();
    that.drawUserList(that.data.people);
    that.drawPlot(json.data.days);
  });
}

Rankings.prototype.handleEvents = function(){
  var that = this;
  this.$domRef.find('select').change(function(){
    that.category = $(this).val()
    that.sortData();
    that.containerDiv.remove()
    that.svgDiv.remove()
    that.drawUserList(that.data.people);
    that.drawPlot(that.data.days);

    // //update userlist
    // d3.selectAll('userStat')
    //   .data(that.data)
    //   .transition()
    //   .duration(2500)
    //   .text(function(d) { 
    //     var c = that.category

    //     if(d[c]) {
    //       return d[c].count
    //     } else {
    //       return '0'
    //     }  
    //   })

  })
}

Rankings.prototype.sortData = function(){
  var category = this.category,
      comparator = function(a, b) {
        if(!a[category]) a[category] = category
        if(!b[category]) b[category] = category
        var d1 = a[category].count;
        var d2 = b[category].count;
        if (d1 == d2) return 0;
        if (d1 < d2) return 1;
        return -1;
      }
  this.data.people.sort(comparator);
}

Rankings.prototype.drawUserList = function(data){
  var users, userName, userStat;
  var that = this;

  this.containerDiv = d3.select("#rankings").append("div")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", "rank-user-list")

  user = this.containerDiv.selectAll("div")
    .data(data)
    

  var userEnter = user.enter().append('div')
    

  userPhoto = userEnter
    .append('img')
    .attr("src", function(d){return d.avatar_url})
    .attr("width", 35)
    .attr("height", 35)

  userName = userEnter.append('div')
    .attr("class", "user-name")
    .text(function(d){
      return d.name 
    })
    .append('rank-stat')

  userStat = userName
      .text(function(d) { 
        var c = that.category
        if(d[c]) {
          return d[c].count + " " + c
        } else {
          return '0'
        }  
      })

}


function hasObjectWithValue(array, key, value){
  var hasVal = false,
      obj;
  for (var i = 0; i < array.length; i++) {
    objVal = array[i][key];
    if (objVal == value) hasVal = true;
  };
  return hasVal;
}
function findObjectByAttr(array, key, value){
  var obj;
  for (var i = 0; i < array.length; i++) {
    objVal = array[i][key];
    if (objVal == value) obj = array[i];
  };
  return obj;
}

Rankings.prototype.drawPlot = function(data){
  // console.log('draw rankings plot')
  var that = this;
  data = data[this.category]

  data.sort(function(a, b) {
    var d1 = getDate(a.date);
    var d2 = getDate(b.date);
    if (d1 == d2) return 0;
    if (d1 > d2) return 1;
    return -1;
  });


  var margin = {top: 20, right: 0, bottom: 30, left: 0},
      width = $('#rankings-plot').width()  - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;


  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var z = d3.scale.category20c();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(d3.time.months, 2).tickPadding(10).tickFormat(d3.time.format("%b %y")).tickSize(-height).tickSubdivide(1);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var stack = d3.layout.stack()
      .offset("silhouette")
      .values(function(d) { return d.values; })
      .x(function(d) { return d.date; })
      .y(function(d) { return d.value; });

  var nest = d3.nest()
      .key(function(d) { return d.key; });

  var area = d3.svg.area()
      .interpolate("cardinal")
      .x(function(d) { return x(d.date); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

    this.svgDiv =  d3.select("#rankings-plot").append("div")
    var svg = this.svgDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)


    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
      d.date = getDate(d.date);
      d.value = +d.value;
    });

    var layers = stack(nest.entries(data));

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

    svg.selectAll(".layer")
        .data(layers)
      .enter().append("path")
        .attr("class", "layer")
        .attr("d", function(d) { return area(d.values); })
        .style("fill", function(d, i) { return z(i); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .call(yAxis);




}






// TOTALS
// ~~~~~~~~~~~~~~~~~~~!


function drawTotals(){
  var statContainer = d3.select("#totals").append("div")
      .attr("class", "stat-container")

  d3.json("data/totals", function(error, json) {
    
    totalDays = json.data[1].count //HACK TO A GLOBAL BRO

    stats = statContainer.selectAll("div")
      .data(json.data)
      .enter()
      .append("div")  

    statsAttr = stats
      .text(function(d) { return numberWithCommas(d.count); })
      .append('span')
      .text(function(d) { return d.type; })

  });


}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}









// DAY CHART
// ~~~~~~~~~~~~~~~~~~~!


function drawDayChart(){
  var dayChartContainer = d3.select("#line").append("div")
        .attr("class", "day-chart-container")

  $(".day-chart-container").append("<div class='infobox' style='display:none;'>Test</div>");



  d3.json("data/days", function(error, json) {
    var data, x, y,
        m = [20, 40, 20, 60], // margins
        width = window.innerWidth - m[1] - m[3], // width
        height = (window.innerWidth/4) - m[0] - m[2]; // height

    data = json.data;

    data.sort(function(a, b) {
      var d1 = getDate(a.date);
      var d2 = getDate(b.date);
      if (d1 == d2) return 0;
      if (d1 > d2) return 1;
      return -1;
    });



    minDate = d3.min(data, function(d){ 
          var date = getDate(d.date);
          return date
        });
    maxDate = d3.max(data, function(d){ 
          var date = getDate(d.date);
          return date
        });

    x = d3.time.scale().domain([minDate, maxDate]).range([0, width]);
    y = d3.scale.linear().domain([0, d3.max(data, function(d) { return d.count; } )]).range([height, 0]);

    // create a line function that can convert data[] into x and y points
    var line = d3.svg.line()
      .x(function(d, i) {
        return x(getDate(d.date)); //x(i);
      })
      .y(function(d) {
        return y(d.count);
      });

    function xx(e) { return x(getDate(e.date)); };
    function yy(e) { return y(e.count); };

    var graph = d3.select(".day-chart-container").append("svg:svg")
      .attr("width", width + m[1] + m[3])
      .attr("height", height + m[0] + m[2])
      .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

    var xAxis = d3.svg.axis().scale(x).ticks(d3.time.months, 2).tickPadding(10).tickFormat(d3.time.format("%b %y")).tickSize(0).tickSubdivide(1);
      // Add the x-axis.
      graph.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // create left yAxis
    var yAxisLeft = d3.svg.axis().scale(y).ticks(10).tickPadding(10).tickSize(-width).orient("left"); //.tickFormat(formalLabel);
      // Add the y-axis to the left
      graph.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(-5,0)")
      .call(yAxisLeft);

    graph
      .selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("fill", "steelblue")
      .attr("r", function(d){
        if (d.count > 0) return 2
      })
      .attr("cx", xx)
      .attr("cy", yy)
      .on("mouseover", function(d) {  showData(this, d);})
      .on("mouseout", function(){  hideData();});

      graph.append("svg:path").attr("d", line(data));

  });
}

function showData(obj, d) {
   var coord = d3.mouse(obj);
   var infobox = d3.select(".infobox");
   // now we just position the infobox roughly where our mouse is
   infobox.style("left", (coord[0]) + "px" );
   infobox.style("top", (coord[1]) + "px");
   var date = getDate(d.date);
   var fDate = date.toDateString()
   $(".infobox").html(d.count + " posts <br/><span>" + fDate +"</span>");
   $(".infobox").show();
 }
 
function hideData() {
 $(".infobox").hide();
 }

function getDate(d) {
  var dt = new Date(d);
  return dt;
}




// BUBBLE MAP
// ~~~~~~~~~~~~~~~~~~~!


function drawBubblemap(){

var diameter = window.innerWidth,
    format = d3.format(",d"),
    color = d3.scale.category20c();

var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(4);

var svg = d3.select("#bubble").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

d3.json("data/word_tree", function(error, json) {
  var root = {}
  root.children = json.data.count

  var node = svg.selectAll(".node")
      .data(bubble.nodes(classes(root))
      .filter(function(d) { return !d.children; }))
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("title")
      .text(function(d) { return d.className + ": " + format(d.value); });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill",'rgba(6, 98, 150, 0.21)');

  node.append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .text(function(d) { return d.className.substring(0, d.r / 3); })
    
});

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
  var classes = [];

  function recurse(name, node) {
    if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
    else classes.push({packageName: name, className: node.name, value: node.size});
  }

  recurse(null, root);
  return {children: classes};
}

d3.select(self.frameElement).style("height", diameter + "px");



}


function constrain(aNumber, aMin, aMax) {
  return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;
}






// TREEMAP
// ~~~~~~~~~~~~~~~~~~~!

function drawTreemap(){
  var margin = {top: 40, right: 30, bottom: 10, left: 30},
      width = window.innerWidth - margin.left - margin.right,
      height = 9000 - margin.top - margin.bottom;

  var color = d3.scale.category20c();

  function comparator(a, b) {
    return a.value - b.value;
  }

  var treemap = d3.layout.treemap()
      .size([width, height])
      .sticky(true)
      .sort(comparator)
      .value(function(d) { 
        return d.size; 
      });

  var div = d3.select("body").append("div")
      .style("position", "relative")
      .style("width", (width + margin.left + margin.right) + "px")
      .style("height", (height + margin.top + margin.bottom) + "px")
      .style("left", margin.left + "px")
      .style("top", margin.top + "px");

  d3.json("data/word_tree", function(error, json) {
    // console.log(json)
    var root = {}
    root.children = json.data.count

    var node = div.datum(root).selectAll(".node")
        .data(treemap.nodes)
      .enter()
      .append("div")
        .attr("class", "node")
        .call(position)
        .style("background", function(d) { return d.children ? '#ececea' : null; })
      .append("span")
        .attr("class", "name")
        .text(function(d) { return d.children ? null : d.name; })
        // .style("font-size", function(d) { return constrain(d.value, 8, 100 )+ "px"})
        // .style("line-height", function(d) { return constrain(d.value, 8, 100 )+ "px"})
      .append("span")
        .attr("class", "val")
        .text(function(d) { return d.children ? null : d.value; });
  });

  function position() {
    this.style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
  }
}



