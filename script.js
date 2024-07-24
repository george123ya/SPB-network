// Load the JSON file
d3.json('./networkx_data.json').then(data => {
    // Convert JSON data to nodes and links
    const nodes = data.nodes;
    const links = data.links;

    // Separate authors and interest areas
    const authors = nodes.filter(d => d.photo);
    const interestAreas = nodes.filter(d => !d.photo);

    let bodyHeight = d3.select("body").node().getBoundingClientRect().height;
    let bodyWidth = d3.select("body").node().getBoundingClientRect().width;
    
    let mainWidth = +d3.select("#mainNetwork").attr("width");
    let mainHeight = +d3.select("#mainNetwork").attr("height");
    
    // Define the initial zoom level
    const initialScale = 0.8;  // Adjust the scale to start with less zoom
    const initialTransform = d3.zoomIdentity.translate(mainWidth / 4 + 550, mainHeight / 4 + 400).scale(initialScale);

    
    // Define the zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", zoomed);

    function zoomed(event) {
        mainSvg.attr("transform", event.transform);
    }
    
    // Main network setup
    const mainSvgContainer = d3.select("#mainNetwork")
    .call(zoom)
    .append("g")
    .attr("transform", initialTransform);  // Apply the initial transformation
    
    const mainSvg = mainSvgContainer.append("g");
    
    const mainSimulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(mainWidth / 2, mainHeight / 2));
    
    const mainLink = mainSvg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("class", "link");
    
    const mainNode = mainSvg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("class", d => d.photo ? "node author" : "node interest")
    .attr("r", 10)
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

    //Container for the gradients
    var defs = mainSvg.append("defs");

    //Filter for the outside glow
    var filter = defs.append("filter")
        .attr("id","glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation","3.5")
        .attr("result","coloredBlur");
    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in","coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in","SourceGraphic");

    // Add text labels for interest areas
    console.log(nodes);
    
    // Font size depends on the number of neighbors

    mainSvg.selectAll(".label")
        .data(interestAreas)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(d => d.id)
        // links.filter(link => link.source.id === nodeId || link.target.id === nodeId);
        .style("font-size", d => {
            // if id is "Others" then return 14px
            if (d.id === "Others") return "14px";
            // get the number of neighbors
            const neighbors = links.filter(link => link.source.id === d.id || link.target.id === d.id);
            // only if the node has > 1 neighbors return the font size
            // console.log(neighbors.length);
            if (neighbors.length > 1) {
                return `${14 + 1.3*(neighbors.length)}px`;
            } else {
                return "0px";
            }
        })
        // user select none to prevent text selection
        .style("-webkit-user-select", "none")
        // make not clickable 
        .style("pointer-events", "none").classed("label", true);

    // console.log("Nodes:", nodes);

    mainNode.append("title")
        .text(d => d.id);

    mainSimulation
        .nodes(nodes)
        .on("tick", ticked);

    mainSimulation.force("link")
        .links(links);

    function ticked() {
        mainLink
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        mainNode
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        mainSvg.selectAll(".label")
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    function dragstarted(event, d) {
        if (!event.active) mainSimulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) mainSimulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Card for the author
    const authorCard = d3.select(".card");

    showImages(".national .authorPhotos", authors.filter(d => d.country == "Peru"));
    showImages(".international .authorPhotos", authors.filter(d => d.country != "Peru"));

    function zoomToNode(nodeId) {

        // console.log("Zooming to node:", nodeId);

        // Find the node with the given id
        const node = nodes.find(d => d.id === nodeId);

        // Get the coordinates of authorCard to adjust the zoom

        let cardX = authorCard.node().getBoundingClientRect().x;
        let cardY = authorCard.node().getBoundingClientRect().y;

        // if cardX is negative, then add 400

        if (cardX < 0) {
            cardX = 27;
        }

        let bodyHeight = d3.select("body").node().getBoundingClientRect().height;
        let bodyWidth = d3.select("body").node().getBoundingClientRect().width;
        
        let mainWidth = d3.select("#mainNetwork").node().getBoundingClientRect().width;
        let mainHeight = d3.select("#mainNetwork").node().getBoundingClientRect().height;
        
        // 548.77ln(x) - 3602.4

        let correct = 548.77*Math.log(mainWidth) - 3602.4;

        // console.log((1/(mainWidth))*200000);
        // console.log(bodyWidth, bodyHeight);
        console.log(mainWidth, mainHeight);
        // console.log(cardX, cardY);

        // If the node is found, zoom to it
        if (node) {
            const transform = d3.zoomIdentity.translate(- node.x + correct, - node.y - (1/mainHeight)*130000).scale(1);
            mainSvgContainer.transition().duration(750).call(zoom.transform, transform);
        }
    }

    function showImages(object, authors) {

        const photoContainer = d3.selectAll(object);
    
        photoContainer.selectAll("div")
            .data(authors)
            .enter().append("div")
            .attr("class", "container")
            .append("div")
            .attr("class", "box")
            .append("div")
            .attr("class", "Inside")
            // select all .box of the object
            .selectAll(object + " .box")
            .on("click", function(event, d) {
                // if some box is selected, remove the class
                if (d3.select(this).classed("box-selected")) {
                    d3.selectAll(".box").classed("box-selected", false);
                } else {
                    console.log("Clicked on:", d.id);
                    d3.selectAll(".box").classed("box-selected", false);
                    d3.select(this).classed("box-selected", true);
                }
            })
            d3.selectAll(object + " .Inside")
            .append("div")
            .attr("class", "wrapper")
            .append("img")
            .attr("src", d => d.photo)
            // .attr("alt", d => d.name)
            .attr("class", "photo")
            .attr("title", d => d.name)
            .on("mouseover", function(event, d) {
                // Highlight the node in the main network
                mainSvg.selectAll(".node").filter(node => node.id === d.id)
                    .classed("author-node", true)})
            .on("mouseout", function(event, d) {
                // Remove the highlight from the node in the main network
                mainSvg.selectAll(".node").filter(node => node.id === d.id)
                    .classed("author-node", false)})
            .on("click", function(event, d) {
    
                // console.log(authorCard.classed("card-visible"));
    
                if (d3.select(this).classed("highlight")) {
                    d3.selectAll(".photo").classed("highlight", false);
                    d3.selectAll(".node").classed("highlight-node", false);
                    d3.selectAll(".link").classed("highlight", false);
                    authorCard.classed("card-visible", false);
    
                } else {
                    d3.selectAll(".photo").classed("highlight", false);
                    d3.select(this).classed("highlight", true);
                    highlightNeighbors(d.id);
                    showAuthorNameCard(d.id);
                    // zoom to the node
                    zoomToNode(d.id);
                }
            })
            // add div .text 
            d3.selectAll(object + " .wrapper")
            .append("div")
            .attr("class", "text");
    }

        // .text(d => d.name);

    // Highlight neighbors
    function highlightNeighbors(nodeId) {
        // console.log("Highlighting neighbors of:", nodeId);

        // Reset previous highlights in the main network
        mainSvg.selectAll(".node").classed("highlight-node", false);
        mainSvg.selectAll(".link").classed("highlight", false);

        // Find and highlight neighbors in the main network
        const neighbors = links.filter(link => link.source.id === nodeId || link.target.id === nodeId);

        neighbors.forEach(link => {
            mainSvg.selectAll(".node").filter(d => d.id === link.source.id || d.id === link.target.id)
                .classed("highlight-node", true);
            mainSvg.selectAll(".link").filter(d => d.source.id === link.source.id && d.target.id === link.target.id)
                .classed("highlight", true);
        });

        // set .author-node to the clicked node
        mainSvg.selectAll(".node").filter(d => d.id === nodeId)
            .classed("author-node", true);
    }

    function flagUrl(country) {
        let countryFlags = {
            "Peru": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Peru.svg/1024px-Flag_of_Peru.svg.png",
            "USA": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/1024px-Flag_of_the_United_States.svg.png",
            "Mexico": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/1024px-Flag_of_Mexico.svg.png",
            "Argentina": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/1024px-Flag_of_Argentina.svg.png",
            "Brasil": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/1024px-Flag_of_Brazil.svg.png",
            "Chile": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Flag_of_Chile.svg/1024px-Flag_of_Chile.svg.png",
            "España": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/1024px-Flag_of_Spain.svg.png",
            "Portugal": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Portugal.svg/1024px-Flag_of_Portugal.svg.png",
            "Sweden": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Sweden.svg/1024px-Flag_of_Sweden.svg.png",
        }

        return countryFlags[country];
    }

    function showAuthorNameCard(authorId) {
        // console.log("Showing author card for:", authorId);
        const author = authors.find(d => d.id === authorId);
        let scholarUrl = author.scholar_id;
        console.log(author);

        const nameText = author.grade + " " + author.name;

        authorCard.select(".authorName").text(nameText);
        // authorCard.select(".scholarLink").attr("href", scholarUrl);
        authorCard.selectAll('.scholarLink').attr("href", scholarUrl);
        // authorCard.select(".authorPhoto").attr("href", scholarUrl);
        authorCard.select(".authorAffiliation").text(author.affiliation);
        authorCard.select(".flagPhoto").attr("src", flagUrl(author.country));
        // authorCard.select(".authorCountry").text(author.country);
        console.log(author.orcid);
        if (author.orcid == undefined) {
            // authorCard.select(".ORCIDtext").text("");
            authorCard.select(".authorORCID").text("No ORCID");
        } else {
            authorCard.select(".ORCIDtext").text("ORCID:\xa0");
            authorCard.select(".authorORCID").text(author.orcid);
        }
        
        if (author.hindex == undefined) {
            // authorCard.select(".htext").text("");
            authorCard.select(".authorh").text("No Google Scholar");
        } else {
            authorCard.select(".htext").text("h-index:\xa0");
            authorCard.select(".authorh").text(author.hindex);
        }

        // add photo
        console.log(author.photo);
        authorCard.select(".authorPhoto").attr("src", author.photo);
        
        // set card class to .card-visible
        authorCard.classed("card-visible", true);

    }
});
