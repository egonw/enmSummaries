var plot = function(where, values) {

// Formatters for counts and times (converting numbers to Dates).
var formatCount = d3.format(",.0f");

var margin = {top: 10, right: 30, bottom: 30, left: 30},
    width = 400 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

    if (values.length < 2) {
      $(where).append("<span>Not enough data.</span>")
      return; // cannot plot with less than 2 data points
    }

console.log("values: " + values.length)
console.log(values)

var x = d3.scale.linear()
    .domain([Math.min.apply(null, values), Math.max.apply(null, values)])
    .range([0, width]);

// Generate a histogram using twenty uniformly-spaced bins.
var data = d3.layout.histogram()
    .bins(x.ticks(35))
    (values);
    console.log("data: " + data)

var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var svg = d3.select(where).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var bar = svg.selectAll(".bar")
    .data(data)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", x(data[0].x  + data[0].dx) - 1) // see http://stackoverflow.com/questions/15388481/d3-js-histogram-with-positive-and-negative-values
    .attr("height", function(d) { return height - y(d.y); });

bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", x(data[0].dx) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.y); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
      console.log("Plotting done.")
}

var processSubstance = function(success, status, response){
  document.getElementById("json").innerHTML = "<pre>" + JSON.stringify(response, null, '  ') + "</pre>";
  var size;
  for (i=0;i<response.study.length;i++) {
    substance = response.study[i]
    owner = substance.owner
    if (owner.company != null && owner.company.name != null) {
      uuid = substance.owner.substance.uuid
      uuidOwner = owner.company.uuid
      uuidOwner = owner.company.uuid
      name = owner.company.name
      topCath = substance.protocol.topcategory
      cath = substance.protocol.category.title
      cathURL = substance.protocol.category.term
      content =
        "<tr><td><a href=\"https://apps.ideaconsult.net/enanomapper/substance/" + uuid + "/study\">" + materialNames[uuid] +
        "</a></td><td><a href=\"" + cathURL + "\">" + cath +
        "</a></td><td>" + substance.protocol.endpoint +
        "</td><td><a href=\"https://apps.ideaconsult.net/enanomapper/substanceowner/" + uuidOwner + "\">" + name +
        "</a></td><td>"
      if (substance.citation != null && substance.citation.title != null) {
        doiURI = substance.citation.title
        content += "<a href=\"" + doiURI + "\">" + doiURI + "</a>";
      }
      content += "</td></tr>";
      //document.getElementById("content"+topCath).innerHTML += content;
      $("#table" + topCath + " tbody").append(content);
      $("#table" + topCath).trigger("update", [true]);
      if (topCatCounts[topCath]) {
        topCatCounts[topCath] = topCatCounts[topCath] + 1
      } else {
        topCatCounts[topCath] = 1
      }
    }
    var study = response.study[i]
    for (j=0;j<study.effects.length;j++) {
      var effect = study.effects[j]
      // console.log("effect: " + effect)
      if (effect.endpoint == "PARTICLE SIZE" || effect.endpoint == "PRIMARY SIZE 1ST DIMENSION") {
        if (effect.result.unit == "nm") {
          if (effect.result.loValue) {
            size = effect.result.loValue;
            if (size < 500) {
              sizesVal[sizeCount]  = size;
              sizeCount = sizeCount + 1;
            }
          }
        }
      }
      if (effect.endpoint == "ZETA POTENTIAL") {
        if (effect.result.unit == "mV") {
          if (effect.result.loValue) {
            zeta = effect.result.loValue;
            zetasVal[zetaCount]  = zeta;
            zetaCount = zetaCount + 1;
          }
        }
      }
    }
  }
  workload = workload - 1;
  if (workload > 0) {
    document.getElementById("workload").innerHTML = "" + workload + " still to load";
  } else if (workload == 0) {
    document.getElementById("workload").innerHTML = "";
    plot(".sizes", sizesVal);
    plot(".zetas", zetasVal);

    // now convert the topCat counts to data
    var data = [];
    for (key in topCatCounts) {
      keyStr = key
      if (keyStr.length > 16) keyStr = keyStr.substring(0,14) + ".."
        data.push({name:keyStr, value:topCatCounts[key]})
    }

    plotPie(data, "props");
  }
};

var plotPie = function(data, where) {
  var width = 200,
    height = 300,
    radius = Math.min(width, height) / 2;

  var color = d3.scale.category20();

  var arc = d3.svg.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.value; });

  var svg = d3.select("." + where).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr(
      "transform",
      "translate(" + width / 2 + "," + height / 2 + ")"
    );

  data.forEach(function(d) {
    d.value = +d.value;
  });
  
  var g = svg.selectAll(".chart")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "chart");

  g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color(d.data.name); });

  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .text(function(d) { if (d.data.value > substanceCount/5) return d.data.name; return "";});
}

var processList = function(success, status, response){
  substanceCount = response.substance.length
  document.getElementById("summary").innerHTML =
    "There are " + substanceCount + " nanomaterials found."
  for (i=0;i<substanceCount;i++) {
    var substance = response.substance[i]
    uuid = substance.i5uuid
    materialNames[uuid] = substance.name;
    searcher.info(substance.URI, processSubstance);
    workload = workload + 1;
    document.getElementById("workload").innerHTML = "" + workload;
  }

  // make a provider pie chart
  var data = [];

  // count the units
  unitCounts = {};
  list = response.substance
  max = 0
  for (i=0; i<list.length; i++) {
    item = list[i]
    if (item.ownerName) {
      units = item.ownerName;
    }
    if (!units) units = "none"
    if (unitCounts[units]) {
      unitCounts[units] = unitCounts[units] + 1
    } else {
      unitCounts[units] = 1
    }
    max = Math.max(max, unitCounts[units])
  }

  // now convert the unit counts to data
  for (key in unitCounts) {
    keyStr = key
    if (keyStr.length > 16) keyStr = keyStr.substring(0,14) + ".."
    data.push({name:keyStr, value:unitCounts[key]})
  }

  plotPie(data, "chart");

};

