let svg, g, zoom, root, treeLayout;
let i = 0;
let width, height;
let selectedNode = null;
const margin = { top: 20, right: 120, bottom: 20, left: 120 };

// Scales for Semantic Visual Encoding
const radiusScale = d3.scaleSqrt().domain([0, 2500000]).range([4, 25]);

async function init() {
    try {
        const response = await fetch('hierarchy.json');
        const data = await response.json();

        width = document.getElementById('viz-area').clientWidth;
        height = document.getElementById('viz-area').clientHeight;
        
        if (height === 0) height = window.innerHeight - 80;

        render(data);

        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);

        const totalNodes = d3.hierarchy(data).descendants().length;
        document.getElementById('stats').innerText = `Visualizing ${totalNodes.toLocaleString()} data points (Collapsible Tree)`;

    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('loader').innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 2rem;">
                <h3>Failed to load data</h3>
                <p>${error.message}</p>
                <p style="margin-top: 1rem;">Make sure you are running this file through a web server (like Live Server or Laragon localhost)</p>
            </div>
        `;
    }
}

function render(data) {
    const vizArea = d3.select("#viz-area");
    vizArea.selectAll("*").remove();

    svg = vizArea.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height]);

    zoom = d3.zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    treeLayout = d3.tree().nodeSize([40, 250]);

    root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    root.descendants().forEach((d) => {
        d.id = ++i;
        d._children = d.children;
    });

    applyInitialCollapse(root);

    update(root);
    updateKPI(root);

    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8));
}

function applyInitialCollapse(d) {
    function collapse(node) {
        if (node.children) {
            node._children = node.children;
            node._children.forEach(collapse);
            if (node.depth >= 3) {
                node.children = null;
            }
        }
    }
    if (d.children) {
        d.children.forEach(collapse);
    }
}

function update(source) {
    const treeData = treeLayout(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    nodes.forEach(d => { d.y = d.depth * 250 });

    // --- Nodes ---
    const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on('click', click)
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", d => d.data.Profit < 0 ? "var(--danger)" : "var(--success)")
        .style("filter", "drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))");

    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? - (radiusScale(d.data.Sales || 0) + 5) : (radiusScale(d.data.Sales || 0) + 5))
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .style("fill", "var(--text-muted)")
        .style("font-size", "11px")
        .text(d => d.data.name)
        .style("fill-opacity", 1e-6);

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(750)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle.node')
        .attr('r', d => Math.max(4, radiusScale(d.data.Sales || 0)))
        .style("fill", d => d.data.Profit < 0 ? "var(--danger)" : "var(--success)")
        .style("stroke", d => d === selectedNode ? "#fff" : "none")
        .style("stroke-width", d => d === selectedNode ? "3px" : "0")
        .style("opacity", d => d._children && !d.children ? 0.7 : 1)
        .attr('cursor', 'pointer');

    nodeUpdate.select('text')
        .transition().duration(750)
        .attr("dy", d => {
            // If the node is on the active path, shift the text up to avoid overlapping with the line
            if (selectedNode) {
                let curr = selectedNode;
                while (curr) {
                    if (curr === d) return "-1.2em"; // Move text higher up
                    curr = curr.parent;
                }
            }
            return ".35em"; // Default vertical alignment
        })
        .attr("x", d => d.children || d._children ? - (Math.max(4, radiusScale(d.data.Sales || 0)) + 6) : (Math.max(4, radiusScale(d.data.Sales || 0)) + 6))
        .style("fill-opacity", 1)
        .style("font-weight", d => d === selectedNode ? "bold" : "normal")
        .style("fill", d => d === selectedNode ? "#fff" : "var(--text-muted)");

    const nodeExit = node.exit().transition()
        .duration(750)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style("fill-opacity", 1e-6);

    // --- Links ---
    const link = g.selectAll('path.link')
        .data(links, d => d.target.id);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(750)
        .attr('d', d => diagonal(d.source, d.target))
        .attr("class", d => {
            if (selectedNode) {
                let curr = selectedNode;
                while (curr) {
                    if (curr === d.target) return "link active-path";
                    curr = curr.parent;
                }
            }
            return "link";
        })
        .style("stroke", d => {
            if (selectedNode) {
                let curr = selectedNode;
                while (curr) {
                    if (curr === d.target) return "#fff";
                    curr = curr.parent;
                }
            }
            return d.target.data.Profit < 0 ? "rgba(239, 68, 68, 0.2)" : "var(--link-color)";
        });

    const linkExit = link.exit().transition()
        .duration(750)
        .attr('d', d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function updateKPI(d) {
    const data = d.data;
    const sales = data.Sales || 0;
    const profit = data.Profit || 0;
    const margin = sales === 0 ? 0 : ((profit / sales) * 100);
    
    let leafCount = 0;
    function countLeaves(node) {
        if (node.children) node.children.forEach(countLeaves);
        else if (node._children) node._children.forEach(countLeaves);
        else leafCount++;
    }
    
    if (d.children || d._children) {
        countLeaves(d);
    } else {
        leafCount = 1;
    }

    document.getElementById('kpi-title').innerText = data.name;
    document.getElementById('kpi-sales').innerText = `$${sales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const profitEl = document.getElementById('kpi-profit');
    profitEl.innerText = `$${profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    profitEl.style.color = profit < 0 ? 'var(--danger)' : 'var(--success)';
    
    const marginEl = document.getElementById('kpi-margin');
    marginEl.innerText = `${margin.toFixed(2)}%`;
    marginEl.style.color = margin < 0 ? 'var(--danger)' : 'var(--success)';
    
    document.getElementById('kpi-orders').innerText = leafCount.toLocaleString();
}

function click(event, d) {
    selectedNode = d;
    updateKPI(d);
    
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
}

function showTooltip(event, d) {
    const tooltip = d3.select("#tooltip");
    const data = d.data;

    let content = `<div style="font-weight: bold; color: var(--accent); border-bottom: 1px solid #334155; margin-bottom: 0.5rem; padding-bottom: 0.25rem;">${data.name}</div>`;

    if (data["Order ID"]) {
        content += `
            <div class="tooltip-row"><span class="tooltip-label">Order ID:</span> <span class="tooltip-value">${data["Order ID"]}</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Customer:</span> <span class="tooltip-value">${data["Customer Name"]}</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Product:</span> <span class="tooltip-value" style="font-size: 0.7rem; text-align: right; margin-left: 10px;">${data["Product Name"]}</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Sales:</span> <span class="tooltip-value" style="color: #10b981;">$${data["Sales"]}</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Profit:</span> <span class="tooltip-value" style="color: ${parseFloat(String(data["Profit"]).replace(',', '.')) >= 0 ? '#10b981' : '#ef4444'};">$${data["Profit"]}</span></div>
        `;
    } else {
        content += `<div class="tooltip-row"><span class="tooltip-label">Type:</span> <span class="tooltip-value">${d._children || d.children ? "Organizational Node" : "Leaf Node"}</span></div>`;
        content += `<div class="tooltip-row"><span class="tooltip-label">Child Nodes:</span> <span class="tooltip-value">${d.children ? d.children.length : (d._children ? d._children.length : 0)}</span></div>`;

        if (data["Sales"] !== undefined && data["Profit"] !== undefined) {
            content += `<div class="tooltip-row"><span class="tooltip-label">Total Sales:</span> <span class="tooltip-value" style="color: #10b981;">$${data["Sales"]}</span></div>`;
            content += `<div class="tooltip-row"><span class="tooltip-label">Total Profit:</span> <span class="tooltip-value" style="color: ${parseFloat(String(data["Profit"]).replace(',', '.')) >= 0 ? '#10b981' : '#ef4444'};">$${data["Profit"]}</span></div>`;
        }
    }

    tooltip
        .style("display", "block")
        .html(content)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 20) + "px");

    const currentR = parseFloat(d3.select(event.currentTarget).select("circle").attr("r"));
    d3.select(event.currentTarget).select("circle").attr("r", currentR + 3);
}

function hideTooltip(event, d) {
    d3.select("#tooltip").style("display", "none");
    const baseR = Math.max(4, radiusScale(d.data.Sales || 0));
    d3.select(event.currentTarget).select("circle").attr("r", baseR);
}

function resetZoom() {
    selectedNode = null;

    root.descendants().forEach(d => {
        if (d._children) {
            d.children = d._children;
        }
    });
    applyInitialCollapse(root);

    update(root);
    updateKPI(root);

    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8)
    );
}

window.addEventListener('resize', () => {
    const vizArea = document.getElementById('viz-area');
    width = vizArea.clientWidth;
    height = vizArea.clientHeight;
    d3.select("svg")
        .attr("width", width)
        .attr("height", height);
});

init();
