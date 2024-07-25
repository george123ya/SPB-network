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
    let initialScale = 0.8;  // Adjust the scale to start with less zoom
    let initialTransform = d3.zoomIdentity.translate(mainWidth / 4 + 550, mainHeight / 4 + 400).scale(initialScale);

    
    // Define the zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", zoomed);

    function zoomed(event) {
        mainSvg.attr("transform", event.transform);
    }
    
    // Main network setup
    let mainSvgContainer = d3.select("#mainNetwork")
    .call(zoom)
    .append("g")
    .attr("transform", initialTransform);  // Apply the initial transformation
    
    let mainSvg = mainSvgContainer.append("g");
    
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
    
    // it says undefined reading format
    // var formatTime = d3.time.format("%e %B %Y");

    // var formatTime = d3.time.format("%e %B

    var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

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

    // show keywords from interest areas when node is clicked
    // it show a box of the class .keyword-node

    // var div = d3.select("body").append("div")   
    //     .attr("class", "tooltip")               
    //     .style("opacity", 0);

    // mainSvg.selectAll(".interest")
    // .on("mouseover", (event, d) => {
    //     div.transition()
    //         .duration(200)
    //         .style("opacity", .9);
    //     div .html(showKeywords(d.id))
    //         .style("left", (event.pageX + 20) + "px")
    //         .style("top", (event.pageY - 20) + "px");
    //     })
    // .on("mouseout", function(d) {       
    //     div.transition()        
    //         .duration(500)      
    //         .style("opacity", 0);   
    // });


    // if interest area node is clicked, highlight the authors photos and the authors in the network

    mainSvg.selectAll(".interest")
        .on("click", function(event, d) {
            if (d3.select(this).classed("highlight")) {
                d3.selectAll(".interest").classed("highlight", false);
                d3.selectAll(".author").classed("highlight", false);
                d3.selectAll(".node").classed("highlight-node", false);
                d3.selectAll(".link").classed("highlight", false);
                // d3.selectAll(".photo").classed("highlight", false);
                hightlightNodePhotos(d.id, false);
            } else {
                d3.selectAll(".interest").classed("highlight", false);
                // d3.selectAll(".photo").classed("highlight", false);
                d3.select(this).classed("highlight", true);
                hightlightNodePhotos(d.id, true);
                highlightNeighbors(d.id);
            }
        })
        .on("mouseover", function(event, d) {
            mainSvg.selectAll(".node").filter(node => node.id === d.id)
                .classed("author-node", true);
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div .html(showKeywords(d.id))
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function(event, d) {
            mainSvg.selectAll(".node").filter(node => node.id === d.id)
                .classed("author-node", false);
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // if author node is clicked, highlight the authors photos and the authors in the network

    mainSvg.selectAll(".author")
        .on("click", function(event, d) {
            if (d3.select(this).classed("highlight")) {
                d3.selectAll(".author").classed("highlight", false);
                d3.selectAll(".interest").classed("highlight", false);
                d3.selectAll(".node").classed("highlight-node", false);
                d3.selectAll(".link").classed("highlight", false);
                hightlightNodePhotos(d.id, false);
            } else {
                d3.selectAll(".author").classed("highlight", false);
                d3.select(this).classed("highlight", true);
                hightlightNodePhotos(d.id, true);
                highlightNeighbors(d.id);
            }
        })
        .on("mouseover", function(event, d) {
            // Highlight the node in the main network
            mainSvg.selectAll(".node").filter(node => node.id === d.id)
                .classed("author-node", true);
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div .html(showAuthorTooltip(d.id))
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function(event, d) {
            // Remove the highlight from the node in the main network
            mainSvg.selectAll(".node").filter(node => node.id === d.id)
                .classed("author-node", false);
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
        

    function showAuthorTooltip(nodeId) {
        const node = authors.find(d => d.id === nodeId);
        let title = "<span class='area'>" + node.name + "</span>";
        
        return title;
    }

    function getRandomColor() {
        color = "hsl(" + Math.random() * 360 + ", 100%, 30%)";
        return color;
      }


    function showKeywords(nodeId) {
        
        // show keywords with different colors
        const node = interestAreas.find(d => d.id === nodeId);
        // console.log(node);

        let title_text = node.id;

        // add line break to the title word if it is too long
        // find spaces to separate the words

        if (title_text.length > 20) {

            let index = title_text.indexOf(" ", 20);
            // console.log(index);
            if (index == -1) {
                title_text = title_text.substring(0, 20) + " " + title_text.substring(20);
            } else {
                title_text = title_text.substring(0, index) + " " + title_text.substring(index);
            }
            
        }
        
        let title = "<span class='area'>" + node.id + "</span>" 
        
        let keywords = node.keywords;
        
        let keywordString = "";
        
        for (let keyword of keywords) {

            if (keyword.length > 20) {
                keyword = keyword.substring(0, 20) + "...";
            }

            keywordString += "<span class='keyword' style='background-color:" + getRandomColor() + "'>" + keyword + "</span>";
        }
        

        return title + keywordString;
    }


    // Add text labels for interest areas
    // console.log(nodes);
    
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

    // mainNode.append("title")
    //     .text(d => d.id);

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
        // console.log(mainWidth, mainHeight);
        // console.log(cardX, cardY);

        // If the node is found, zoom to it
        if (node) {
            const transform = d3.zoomIdentity.translate(- node.x - correct, - node.y - (1/mainHeight)*130000).scale(1);

            // mainSvgContainer = d3.select("#mainNetwork")
            //     .call(zoom)
            //     .append("g")
            //     .attr("transform", initialTransform);
            mainSvgContainer.transition().duration(750).call(zoom.transform, transform);
        }

        // change zoom identity 
        
    }

    function showImages(object, authors) {

        const photoContainer = d3.selectAll(object);
    
        photoContainer.selectAll("div")
            .data(authors)
            .enter().append("div")
            .attr("class", "container")
            .append("div")
            .attr("class", "box")
            .attr("id", d => d.id)
            .append("div")
            .attr("class", "Inside")
            // select all .box of the object
            .selectAll(object + " .box")
            .on("click", function(event, d) {
                // if some box is selected, remove the class
                if (d3.select(this).classed("box-selected")) {
                    d3.selectAll(".box").classed("box-selected", false);
                } else {
                    // console.log("Clicked on:", d.id);
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
                boxId = d3.select(this).node().parentNode.parentNode.parentNode.id;
                if (d3.select(this).classed("photoHighlight")) {
                    d3.selectAll(".photo").classed("photoHighlight", false);
                    d3.selectAll(".node").classed("highlight-node", false);
                    d3.selectAll(".link").classed("highlight", false);
                    d3.selectAll(".box").classed("photoNoHighlight", false);
                    d3.selectAll(".author").classed("highlight", false);
                    authorCard.classed("card-visible", false);
    
                } else {
                    d3.selectAll(".box").classed("photoNoHighlight", false);
                    d3.selectAll(".photo").classed("photoHighlight", false);
                    // console.log("Clicked on:", d.id);
                    // 'this' is photo id, we want to select .box id which contains this photo
                    d3.selectAll(".box").filter(box => box.id !== boxId)
                        .classed("photoNoHighlight", true);
                    d3.select(this).classed("photoHighlight", true);
                    // d3.selectAll(".box")
                    // .filter(d => !neighbors.find(link => link.source.id === d.id || link.target.id === d.id))
                    // .classed("photoNoHighlight", true);
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

    
    function hightlightNodePhotos(nodeId, bool) {

        if (bool) {
            // reset all the classes first
            d3.selectAll(".box").classed("photoHighlight", false);
            d3.selectAll(".box").classed("photoNoHighlight", false);
            // hide the author card
            authorCard.classed("card-visible", false);

            let neighbors = links.filter(link => link.source.id === nodeId || link.target.id === nodeId);
    
            // select all .container of the object with id node.id and add class .photoHighlight and
            // the rest set .photoNoHighlight
    
            d3.selectAll(".box")
                .filter(d => neighbors.find(link => link.source.id === d.id || link.target.id === d.id))
                .classed("photoHighlight", true);
            d3.selectAll(".box")
                .filter(d => !neighbors.find(link => link.source.id === d.id || link.target.id === d.id))
                .classed("photoNoHighlight", true);
        } else {
            d3.selectAll(".box").classed("photoHighlight", false);
            d3.selectAll(".box").classed("photoNoHighlight", false);
            d3.selectAll(".photo").classed("photoHighlight", false);
        }

    
    }

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
        // mainSvg.selectAll(".node").filter(d => d.id === nodeId)
        //     .classed("author-node", true);
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
        // console.log(author);

        const nameText = author.grade + " " + author.name;

        authorCard.select(".authorName").text(nameText);
        // authorCard.select(".scholarLink").attr("href", scholarUrl);
        authorCard.selectAll('.scholarLink').attr("href", scholarUrl);
        // authorCard.select(".authorPhoto").attr("href", scholarUrl);
        authorCard.select(".authorAffiliation").text(author.affiliation);
        authorCard.select(".flagPhoto").attr("src", flagUrl(author.country));
        // authorCard.select(".authorCountry").text(author.country);
        // console.log(author.orcid);
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
        // console.log(author.photo);
        authorCard.select(".authorPhoto").attr("src", author.photo);
        
        // set card class to .card-visible
        authorCard.classed("card-visible", true);

    }


    let dropdownBtnText = document.getElementById("drop-text");
    let span = document.getElementById("span");
    let icon = document.getElementById("icon");
    let list = document.getElementById("list");
    let input = document.getElementById("search-input");
    let listItems = document.querySelectorAll(".dropdown-list-item");

    dropdownBtnText.onclick = function () {
    list.classList.toggle("show");
    icon.style.rotate = "-180deg";
    };

    window.onclick = function (e) {
    if (
        e.target.id !== "drop-text" &&
        e.target.id !== "icon" &&
        e.target.id !== "span"
    ) {
        list.classList.remove("show");
        icon.style.rotate = "0deg";
    }
    };

    let keywords = []
    let interestAreasList = []
    let authorsList = []
    // get all authors keywords and interest areas
    // structure [{name: "keyword1"}, {name: "keyword2"}]
    interestAreas.forEach(interest => {
        interest.keywords.forEach(keyword => {
            // id is the interest area it comes from
            keywords.push({name: keyword, id: interest.id})
        })
    })
    interestAreas.forEach(interest => {
        interestAreasList.push({name: interest.id, id: interest.id})
    })
    authors.forEach(author => {
        authorsList.push({name: author.name, id: author.id})
    })
    
    let everything = keywords.concat(interestAreasList).concat(authorsList);
    
    let articles = everything;

    function updateArticles(e) {
        span.innerText = e.target.innerText;
        let articles1 = [];
        if (e.target.innerText == "Everything") {
            // console.log("Everything");
            input.placeholder = "Search anything...";
            articles1 = everything;
        } else {
            input.placeholder = "Search in " + e.target.innerText + "...";

            if (e.target.innerText == "Author") {
                articles1 = authorsList;
            } else if (e.target.innerText == "Interest Area") {
                articles1 = interestAreasList;
            } else if (e.target.innerText == "Keyword") {
                articles1 = keywords;
            } else {
                articles1 = everything;
            }
        }
        
        articles = articles1; // Update the outer articles array
        
        showSuggestions(input, articles1);

    }

    for (item of listItems) {
        item.onclick = updateArticles;
    }

    showSuggestions(input, articles);

    function showSuggestions(input, articles) {

        // DOM element handles
        const suggestions = document.getElementById('suggestions')
        
        // utils
        const toLowerCase = (s) => s.toLowerCase()
        const strIncludes = (s1) => (s2) => s1.includes(s2)
        const filterByName = (val) => ({
        name
        }) => strIncludes(toLowerCase(name))(toLowerCase(val))
        
        // emptying a DOM element (#suggestions)
        const empty = (element) => {
        while (element.firstElementChild) {
            element.firstElementChild.remove();
        }
        }
        
        // getting the items from the possible articles
        const getFilteredArray = (arr) => (keyword) => keyword ? arr.filter(filterByName(keyword)) : []
        const getFilteredArticles = getFilteredArray(articles)
        
        // input event handler
        input.addEventListener('input', function(e) {
        const filteredArticles = getFilteredArticles(e.target.value)
        updateSuggestions(suggestions, this)(filteredArticles)
        })
        
        // creating suggestion item DOM element
        const getSuggestionItemEl = (suggestion) => {
        const suggestionItem = document.createElement('div')
        suggestionItem.classList.add('suggestion-item')
        suggestionItem.textContent = suggestion.name
        return {
            suggestionItem,
        }
        }
        
        // base for handling click on suggestion items
        const getListenerFn = (input, article, callback) => (e) => {
        input.value = article.name
        
        if (callback && callback instanceof Function) {
            // if a callback function is defined, then it's called with
            // the following args
            callback(input)
        }
        }
        
        // updating the suggestions list
        const updateSuggestions = (container, input) => (filteredArticles) => {
        // 1. emptying the container
        empty(container)
        
        // 2. generating the DOM elements; adding click handler;
        // adding generated elements to the container (#suggestions)

            filteredArticles.forEach(function(article) {
                const {
                    suggestionItem
                } = getSuggestionItemEl(article)
                suggestionItem.addEventListener('click', function() {
                    input.value = article.name;
                    if (article.id) {
                        
                        // mainSvg = d3.select("#mainNetwork").select("g");
                        zoomToNode(article.id);
                        // showAuthorNameCard(article.id);
                        hightlightNodePhotos(article.id, true);
                        highlightNeighbors(article.id);
                    }
                    empty(container)
                })
                container.append(suggestionItem)
            })


        }
    }

});
