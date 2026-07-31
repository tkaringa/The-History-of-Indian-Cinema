let currentScene = 1;
let dataset = {};
let mod = 'masterpieces';

let width = 900;
let height = 550;
let margin = {top: 50, right: 190, bottom: 50, left: 60};

let colors = {
    'hindi': '#F5A623',      
    'malayalam': '#10B981',   
    'tamil': '#FF4D6D',       
    'telugu': '#00B4D8',      
    'bengali': '#B5179E',     
    'other': '#E2E8F0'        
};

d3.json("data.json").then(function(data) {
    dataset = data;
    
    let legend = d3.select("#legend-container");
    Object.keys(colors).forEach(function(key) {
        let item = legend.append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box").style("background-color", colors[key]);
        item.append("span").text(key.toUpperCase());
    });
    
    render(); 
});

d3.select("#nextBtn").on("click", function() {
    if (currentScene < 3) {
        currentScene++;
        render();
    }
});

d3.select("#prevBtn").on("click", function() {
    if (currentScene > 1) {
        currentScene--;
        render();
    }
});

function render() {
    d3.select("#chart-container").html("").style("position", "relative"); 
    
    let svg = d3.select("#chart-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    if (currentScene === 1) {
        drawScene1(svg);
    } else if (currentScene === 2) {
        drawScene2(svg);
    } else if (currentScene === 3) {
        drawScene3(svg);
    }
}

function drawScene1(svg) {
    let data = dataset.scene1;
    let groupedData = d3.group(data, d => d.LangCategory);
    
    let x = d3.scaleLinear().domain([1930, 2020]).range([margin.left, width - margin.right]);
    let y = d3.scaleLinear().domain([0, 6500]).range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", "translate(0," + (height - margin.bottom) + ")").call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").attr("transform", "translate(" + margin.left + ",0)").call(d3.axisLeft(y));

    let line = d3.line()
        .x(function(d) { return x(d.Decade); })
        .y(function(d) { return y(d.Count); });

    svg.selectAll(".line")
        .data(groupedData)
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", function(d) { return colors[d[0]]; })
        .attr("stroke-width", 2)
        .attr("d", function(d) { return line(d[1]); });

    svg.append("text").attr("x", (width - margin.right + margin.left)/2).attr("y", 25).attr("text-anchor", "middle").attr("fill", "#f5f0e8").text("Scene 1: The Volume of Indian Cinema by Decade");

    let anno = [{
        note: { title: "Hindi Dominance", label: "Production volume separates rapidly." },
        x: x(1990), y: y(1800), dy: -140, dx: -80,
        color: "#e16b29"
    }];
    svg.append("g").style("pointer-events", "none").call(d3.annotation().annotations(anno));
}

function drawScene2(svg) {
    let data = dataset.scene2;
    let decades = Array.from(new Set(data.map(d => d.Decade))).sort();
    let langs = Object.keys(colors);

    let x0 = d3.scaleBand().domain(decades).range([margin.left, width - margin.right]).padding(0.1);
    let x1 = d3.scaleBand().domain(langs).range([0, x0.bandwidth()]).padding(0.05);
    let y = d3.scaleLinear().domain([4, 9]).range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", "translate(0," + (height - margin.bottom) + ")").call(d3.axisBottom(x0));
    svg.append("g").attr("transform", "translate(" + margin.left + ",0)").call(d3.axisLeft(y));

    svg.append("g")
        .selectAll("g")
        .data(d3.group(data, d => d.Decade))
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + x0(d[0]) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return d[1]; })
        .enter().append("rect")
        .attr("x", function(d) { return x1(d.LangCategory); })
        .attr("y", function(d) { return y(d.AvgRating); })
        .attr("width", x1.bandwidth())
        .attr("height", function(d) { return height - margin.bottom - y(d.AvgRating); })
        .attr("fill", function(d) { return colors[d.LangCategory]; });

    svg.append("text").attr("x", (width - margin.right + margin.left)/2).attr("y", 25).attr("text-anchor", "middle").attr("fill", "#f5f0e8").text("Scene 2: Average Rating per Decade Across Industries");

    let targetX = x0(2010) + x1('malayalam') + (x1.bandwidth() / 2);
    let targetY = y(7.0);

    let anno = [{
        note: { title: "Mid-Era Slump & Recovery", label: "Indian films rebounded in the 2010s" },
        x: targetX, y: targetY, dy: -60, dx: -100,
        color: "#e16b29"
    }];
    svg.append("g").style("pointer-events", "none").call(d3.annotation().annotations(anno));
}

function drawScene3(svg) {
    let data = dataset.scene3;
    let tooltip = d3.select("#tooltip");
    
    svg.append("defs").append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    let g = svg.append("g").attr("clip-path", "url(#chart-clip)");
    let xG = svg.append("g").attr("transform", "translate(0," + (height - margin.bottom) + ")");
    let yG = svg.append("g").attr("transform", "translate(" + margin.left + ",0)");


    // zoom in correct spot
    let controlDiv = d3.select("#chart-container").append("div")
        .style("position", "absolute")
        .style("top", "15px")
        .style("right", "20px");

    let button = controlDiv.append("button")
        .attr("class", "tactile-btn")
        .text("Zoom Out")
        .on("click", function() {
            mod = (mod === 'masterpieces') ? 'all' : 'masterpieces';
            updateScene3(data, g, xG, yG, tooltip, button);
        });

    updateScene3(data, g, xG, yG, tooltip, button);

    svg.append("text")
        .attr("x", (width - margin.right + margin.left)/2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("fill", "#f5f0e8")
        .text("Scene 3: The Masterpieces of India");

    let anno = [{
        note: { 
            title: "Explore Parameters", 
            label: "Toggle between high-rated masterpieces and the full dataset.",
            bgPadding: 8,
            wrap: 140 
        },
        x: width - 50, 
        y: 25, 
        dy: 65, 
        dx: -10,
        color: "#e16b29"
    }];

    let annoGroup = svg.append("g")
        .attr("class", "annotation-group")
        .style("pointer-events", "none")
        .call(d3.annotation().annotations(anno));

    annoGroup.selectAll(".annotation-note-bg")
        .style("fill", "#121212")
        .style("fill-opacity", "0.9")
        .style("stroke", "#e16b29")
        .style("stroke-width", "1px")
        .style("rx", "4px");
}

function updateScene3(data, g, xG, yG, tooltip, button) {
    let filtered = mod === 'masterpieces' ? data.filter(function(d) { return d.Rating_clean >= 7.0; }) : data;
    let yDomain = mod === 'masterpieces' ? [7, 10] : [0, 10];
    
    let minYear = d3.min(data, function(d) { return d.Year_clean; }) - 2;
    
    let x = d3.scaleLinear().domain([minYear, 2024]).range([margin.left, width - margin.right]);
    let y = d3.scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);
    let r = d3.scaleSqrt().domain([1000, d3.max(data, function(d) { return d.Votes_clean; })]).range([3, 14]);

    xG.transition().duration(1000).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    yG.transition().duration(1000).call(d3.axisLeft(y));

    let circles = g.selectAll("circle").data(filtered, function(d) { return d['Movie Name'] + d.Year_clean; });

    circles.exit().transition().duration(800).attr("r", 0).remove();

    let newCircles = circles.enter().append("circle")
        .attr("cx", function(d) { return x(d.Year_clean); })
        .attr("cy", function(d) { return y(d.Rating_clean); })
        .attr("r", 0)
        .attr("fill", function(d) { return colors[d.LangCategory]; })
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1);
            tooltip.html("<strong>" + d['Movie Name'] + "</strong><br>Rating: " + d.Rating_clean + "<br>Year: " + d.Year_clean + "<br>Language: " + d.LangCategory)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    newCircles.merge(circles).transition().duration(1000)
        .attr("cx", function(d) { return x(d.Year_clean); })
        .attr("cy", function(d) { return y(d.Rating_clean); })
        .attr("r", function(d) { return Math.max(2.5, r(d.Votes_clean)); });

    button.text(mod === 'masterpieces' ? "Zoom Out" : "Zoom In");
}
