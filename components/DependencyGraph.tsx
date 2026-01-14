import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { DependencyGraphData } from '../types';
import { Search, Filter, X, Circle } from 'lucide-react';

interface DependencyGraphProps {
  data: DependencyGraphData;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [activeType, setActiveType] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Prepare Data (Filter & Clone to handle D3 mutations safety)
  const graphData = useMemo(() => {
    // Deep clone/Sanitize to avoid issues with D3 mutation of props
    const allNodes = data.nodes.map(n => ({ ...n }));
    const allLinks = data.links.map(l => ({
        ...l,
        source: typeof l.source === 'object' ? (l.source as any).id : l.source,
        target: typeof l.target === 'object' ? (l.target as any).id : l.target
    }));

    // Filter
    const nodes = allNodes.filter(n => {
        const typeMatch = activeType === 'all' || n.type === activeType;
        const nameMatch = n.name.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && nameMatch;
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = allLinks.filter(l => 
        nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
    );

    return { nodes, links };
  }, [data, activeType, searchTerm]);


  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear
    d3.select(svgRef.current).selectAll("*").remove();

    if (graphData.nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("font-family", "JetBrains Mono, monospace");

    // Simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // --- Definitions (Markers) ---
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4b5563");

    // --- Elements ---
    const link = svg.append("g")
      .attr("stroke", "#353e58")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      // @ts-ignore
      .call(drag(simulation));

    // Node Visuals
    const getNodeColor = (type: string) => {
        switch(type) {
            case 'log': return '#f87171'; // Red
            case 'metric': return '#fbbf24'; // Amber
            case 'image': return '#a78bfa'; // Purple
            case 'issue': return '#f472b6'; // Pink
            default: return '#3b82f6'; // Blue
        }
    };

    const circles = node.append("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => getNodeColor(d.type))
      .attr("stroke", "#1a1f2e")
      .attr("stroke-width", 2);

    const labels = node.append("text")
      .text((d: any) => d.name)
      .attr("x", 10)
      .attr("y", 3)
      .style("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.9)");

    // --- Interactions (Hover) ---
    const neighbors = new Set<string>();
    graphData.links.forEach((l: any) => {
        neighbors.add(`${l.source.id}|${l.target.id}`);
        neighbors.add(`${l.target.id}|${l.source.id}`);
    });

    const isConnected = (a: string, b: string) => {
        return a === b || neighbors.has(`${a}|${b}`);
    };

    node.on("mouseover", (event, d: any) => {
        // Dim unrelated
        node.transition().duration(200).style("opacity", (o: any) => isConnected(d.id, o.id) ? 1 : 0.1);
        link.transition().duration(200).style("opacity", (l: any) => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05
        ).attr("stroke", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "#e2e8f0" : "#353e58");
        
        labels.style("font-weight", (o: any) => isConnected(d.id, o.id) ? "bold" : "normal")
              .style("fill", (o: any) => isConnected(d.id, o.id) ? "#fff" : "#94a3b8");
    })
    .on("mouseout", () => {
        node.transition().duration(200).style("opacity", 1);
        link.transition().duration(200).style("opacity", 0.6).attr("stroke", "#353e58");
        labels.style("font-weight", "normal").style("fill", "#94a3b8");
    });

    // --- Ticks ---
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => svg.selectAll("g").attr("transform", event.transform));
    // @ts-ignore
    svg.call(zoom);

  }, [graphData]); 

  // Drag Helper
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
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  };
  
  if (data.nodes.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-cosmic-950">
            <p className="mb-2 text-lg font-light text-gray-400">Visualization Empty</p>
            <p className="text-xs text-gray-600">Upload code to view dependency graph</p>
        </div>
    )
  }

  const types = [
    { id: 'all', label: 'All', color: 'bg-gray-500' },
    { id: 'file', label: 'Code', color: 'bg-blue-500' },
    { id: 'metric', label: 'Metric', color: 'bg-amber-500' },
    { id: 'log', label: 'Log', color: 'bg-red-400' },
    { id: 'image', label: 'Image', color: 'bg-purple-400' },
    { id: 'issue', label: 'Issue', color: 'bg-pink-400' },
  ];

  return (
    <div ref={containerRef} className="w-full h-full bg-cosmic-950 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
      }}></div>

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-lg shadow-xl p-2 flex items-center gap-2 w-64">
           <Search size={14} className="text-gray-500" />
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Search modules..." 
             className="bg-transparent border-none text-xs text-gray-200 focus:outline-none w-full placeholder-gray-600"
           />
           {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} className="text-gray-500 hover:text-gray-300" /></button>}
        </div>

        <div className="pointer-events-auto glass-panel rounded-lg shadow-xl p-3 flex flex-col gap-2 w-64">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
             <Filter size={10} />
             <span>Filter Nodes</span>
           </div>
           <div className="grid grid-cols-2 gap-1.5">
             {types.map(t => (
               <button 
                 key={t.id}
                 onClick={() => setActiveType(t.id)}
                 className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                   activeType === t.id 
                     ? 'bg-cosmic-600 text-white shadow-sm ring-1 ring-white/10' 
                     : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                 }`}
               >
                 <span className={`w-1.5 h-1.5 rounded-full ${t.color}`}></span>
                 {t.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move outline-none relative z-1"></svg>
    </div>
  );
};