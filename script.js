let svg, g, zoom, root, treeLayout;
let i = 0;
const width = window.innerWidth;
const height = window.innerHeight - 80;
const margin = { top: 20, right: 120, bottom: 20, left: 120 };

async function init() {
    try {
        // Fetch the JSON data
        const response = await fetch('hierarchy.json');
        const data = await response.json();

        render(data);

        // Hide loader
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);

        // Update stats
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

    // Use fixed node size for a consistent vertical layout
    treeLayout = d3.tree().nodeSize([30, 250]);

    root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;

    // Initialize all nodes and collapse them to prevent lag
    root.descendants().forEach((d) => {
        d.id = ++i;
        d._children = d.children;
    });

    // Collapse all nodes past the first level initially
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    if (root.children) {
        root.children.forEach(collapse);
    }

    update(root);

    // Set initial zoom centered
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8));
}

function update(source) {
    const treeData = treeLayout(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Normalize for fixed-depth
    nodes.forEach(d => { d.y = d.depth * 250 });

    // ****************** Nodes section ***************************
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
        .style("fill", d => d._children ? "var(--node-branch)" : "var(--node-leaf)")
        .style("filter", "drop-shadow(0 0 2px rgba(99, 102, 241, 0.5))");

    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
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
        .attr('r', d => d.children || d._children ? 5 : 3)
        .style("fill", d => d._children ? "var(--node-branch)" : "var(--node-leaf)")
        .attr('cursor', 'pointer');

    nodeUpdate.select('text')
        .style("fill-opacity", 1);

    const nodeExit = node.exit().transition()
        .duration(750)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle')
        .attr('r', 1e-6);

    nodeExit.select('text')
        .style("fill-opacity", 1e-6);

    // ****************** links section ***************************
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
        .attr('d', d => diagonal(d.source, d.target));

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

// Toggle children on click
function click(event, d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

// Diagonal generator for horizontal tree
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

    d3.select(event.currentTarget).select("circle").attr("r", 8);
}

function hideTooltip(event, d) {
    d3.select("#tooltip").style("display", "none");
    d3.select(event.currentTarget).select("circle").attr("r", d.children || d._children ? 5 : 3);
}

function resetZoom() {
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8)
    );
}

// Handle resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight - 80;
    d3.select("svg")
        .attr("width", newWidth)
        .attr("height", newHeight);
});

init();
