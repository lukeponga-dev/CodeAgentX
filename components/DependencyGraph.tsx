import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DependencyGraphData } from '../types';

interface DependencyGraphProps {
  data: DependencyGraphData;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("font-family", "JetBrains Mono, monospace");

    // Force Simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Define arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20) // Shift arrow back slightly
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4b5563");

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation) as any);

    // Node Circles
    node.append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => {
        if (d.type === 'log') return '#f87171'; // Red
        if (d.type === 'metric') return '#fbbf24'; // Amber
        if (d.type === 'image') return '#c084fc'; // Purple
        if (d.type === 'issue') return '#f472b6'; // Pink
        return '#3b82f6'; // Blue (code)
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Node Labels (on hover)
    const labels = node.append("text")
      .text((d: any) => d.name)
      .attr("x", 12)
      .attr("y", 4)
      .style("fill", "#e5e7eb")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        svg.selectAll("g").attr("transform", event.transform);
      });

    // @ts-ignore
    svg.call(zoom);

  }, [data]);

  // Drag utility
  const drag = (simulation: any) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  if (data.nodes.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-2 text-lg">No graph data</p>
            <p className="text-xs">Upload code files with imports to visualize dependencies.</p>
        </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0d1117] overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10 bg-gray-900/80 p-2 rounded border border-gray-800 backdrop-blur-sm">
        <div className="text-[10px] text-gray-400 font-mono space-y-1">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Code</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Metric</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"></div> Log</div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
    </div>
  );
};