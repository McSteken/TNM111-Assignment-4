'use client'

import { useEffect, useRef, useState } from 'react';
import { select, json, forceSimulation, forceLink, forceManyBody, forceCenter, drag } from 'd3';

const Graph = () => {
    const svgRef1 = useRef();
    const svgRef2 = useRef();
    const [data1, setData1] = useState();
    const [data2, setData2] = useState();
    const [minEdgeWeight, setMinEdgeWeight] = useState(1);
    const [minNodeWeight, setMinNodeWeight] = useState(5);
    const [selectedNode, setSelectedNode] = useState(null); // Store the clicked node
    const [selectedNodeData, setSelectedNodeData] = useState(null);
    const [episode1, setEpisode1] = useState('episode-1');
    const [episode2, setEpisode2] = useState('episode-2');

    const episodes = [
        { value: 'full', label: 'All episodes' },
        { value: 'episode-1', label: 'Episode 1' },
        { value: 'episode-2', label: 'Episode 2' },
        { value: 'episode-3', label: 'Episode 3' },
        { value: 'episode-4', label: 'Episode 4' },
        { value: 'episode-5', label: 'Episode 5' },
        { value: 'episode-6', label: 'Episode 6' },
        { value: 'episode-7', label: 'Episode 7' },
    ];

    useEffect(() => {
        json(`StarWarsData/starwars-${episode1}-interactions-allCharacters.json`).then(data => {
            setData1(data);
        });
        //check if the data is loaded
        console.log(data1);
    }, [episode1]);

    useEffect(() => {
        json(`StarWarsData/starwars-${episode2}-interactions-allCharacters.json`).then(data => {
            setData2(data);
        });
    }, [episode2]);

    // rerender on change
    useEffect(() => {
        if (data1) {
            renderGraph(svgRef1, data1);
        }
    }, [data1, minEdgeWeight, minNodeWeight]);

    useEffect(() => {
        if (data2) {
            renderGraph(svgRef2, data2);
        }
    }, [data2, minEdgeWeight, minNodeWeight]);

    // select node
    useEffect(() => {
        if (!svgRef1.current || !svgRef2.current || !data1 || !data2) return;
    
        const updateHighlight = (svgRef) => {
            const svg = select(svgRef.current);
            const connectedNodes = new Set();

            if (selectedNode === null) {
                // Reset to original state
                svg.selectAll('line')
                    .attr('stroke', '#999')
                    .attr('stroke-opacity', 0.8);

                svg.selectAll('circle')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .attr('opacity', 1);
            } else {
                svg.selectAll('line')
                    .attr('stroke', d => {
                        if (d.source.name === selectedNode || d.target.name === selectedNode) {
                            connectedNodes.add(d.source.name);
                            connectedNodes.add(d.target.name);
                            return 'yellow';
                        }
                        return '#999';
                    })
                    .attr('stroke-opacity', d => (d.source.name === selectedNode || d.target.name === selectedNode ? 1 : 0.5));

                svg.selectAll('circle')
                    .attr('stroke', d => (d.name === selectedNode ? 'yellow' : '#fff'))
                    .attr('stroke-width', d => (d.name === selectedNode ? 3 : 1.5))
                    .attr('opacity', d => (d.name === selectedNode || connectedNodes.has(d.name) ? 1 : 0.5));
            }
        };
    
        updateHighlight(svgRef1);
        updateHighlight(svgRef2);
    
    }, [selectedNode]);  
    


    // render the graph
    function renderGraph(svgRef, graphData) {
        console.log(graphData.nodes); // Check if nodes have 'id'
        console.log(graphData.links); // Check if 'source' and 'target' match node ids

        const width = window.innerHeight * 0.7;
        const height = window.innerHeight * 0.7;
        const svg = select(svgRef.current) 
            .attr('width', width)
            .attr('height', height)

        svg.selectAll('*').remove(); // clear the svg before rendering the new graph
        /*
        const filteredNodes = graphData.nodes.filter(d => d.value > minNodeWeight);
        console.log("filtered nodes");
        console.log(filteredNodes);

        /*
        const filteredNodeIds = new Set(filteredNodes.map((node, i) => {
            node.index = i; // Ensure each node has an index
            return node.index;
        })); // Store valid node ids
        console.log(filteredNodeIds);

        const filteredLinks = graphData.links.filter(d => 
            d.value > minEdgeWeight &&
            filteredNodeIds.has(d.source) &&
            filteredNodeIds.has(d.target)
        );
        */
        const filteredLinks = graphData.links.filter(d => d.value > minEdgeWeight);
        
        const simulation = forceSimulation(graphData.nodes) // create a new simulation with the nodes
            .force('link', forceLink(filteredLinks).id(d => d.index).distance(100))
            .force('charge', forceManyBody().distanceMax(80).strength(-150)) 
            .force('center', forceCenter(width / 2, height / 2)); 

        const link = svg.append('g') 
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.8)
            .selectAll('line')
            .data(filteredLinks)
            .join('line')
            .attr('stroke-width', d => Math.sqrt(d.value)); // set the width of the line based on the value of the link

        const node = svg.append('g') // create a new group for the nodes
            .selectAll('circle')
            .data(graphData.nodes)            
            .join('circle')            
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('r', d => 2 * Math.sqrt(d.value)) 
            .attr('fill', d => d.colour) 
            .call(dragHandler(simulation)) // apply drag function to all nodes
            .on('click', (event, d) => {
                 
                    setSelectedNode(d.name);
                    const connectedNodes = graphData.links
                        .filter(link => link.source.name === d.name || link.target.name === d.name)
                        .map(link => ({
                            name: link.source.name === d.name ? link.target.name : link.source.name,
                            value: link.value
                        })); // Store the clicked node's name
                    setSelectedNodeData({
                        name: d.name,
                        value: d.value || "N/A", 
                        connections: connectedNodes
                    });
                }
            );
        const labels = svg.append('g')
            .selectAll('text')
            .data(graphData.nodes)
            .join('text')
            .attr('text-anchor', 'middle') // Center the text horizontally
            .attr('dy', -8) // Position above the node
            .style('font-size', '10px')
            .style('fill', '#fff')
            .text(d => d.name);


        simulation.on('tick', () => { // listen for the tick event and update the position of the nodes and links
            link.attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels.attr('x', d => d.x) // Position text based on node's x-coordinate
                .attr('y', d => d.y - 8); // Slightly above the node

            const padding = 3;
            const nodesBBox = node.nodes().reduce((bbox, node) => { // bounding box
                const x = node.cx.baseVal.value;
                const y = node.cy.baseVal.value;
                return {
                    minX: Math.min(bbox.minX, x) - padding,
                    maxX: Math.max(bbox.maxX, x) + padding,
                    minY: Math.min(bbox.minY, y) - padding,
                    maxY: Math.max(bbox.maxY, y) + padding,
                };
            }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

            // Set the viewBox to fit the nodes within the SVG
            svg.attr('viewBox', `${nodesBBox.minX} ${nodesBBox.minY} ${nodesBBox.maxX - nodesBBox.minX} ${nodesBBox.maxY - nodesBBox.minY}`);
    
        });

        function dragHandler(simulation) {
            return drag()  // use the imported drag from d3
                    .on('start', (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.2).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on('drag', (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on('end', (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    });
            }
            
    }



    return (
    <div className="flex">
        {/* Filter */}
        {/* Graphs */}
        <div className="flex flex-row items-center gap-8">
        <div className="p-4 border-2 border-white w-60 text-white">
            <h2 className="text-lg font-bold">Filter</h2>
            <div>
                <label htmlFor="minNodeWeight" className="block text-white mb-2">Minimum edge weight: {minEdgeWeight}</label>
                <input
                    id="minNodeWeight"
                    type="range"
                    min="1"
                    max="80"
                    value={minEdgeWeight}
                    onChange={e => setMinEdgeWeight(Number(e.target.value))}
                    className="w-full"
                />
            </div>
        </div>

            <div className="flex flex-col items-center justify-center border-2 border-white text-yellow-500">
                <select value={episode1} onChange={e => setEpisode1(e.target.value)}>
                    {episodes.map(episode => (
                        <option key={episode.value} value={episode.value} className='bg-gray-800'>{episode.label}</option>
                    ))}
                </select>
                <svg ref={svgRef1} className="w-full h-full"></svg>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-white text-yellow-500">
                <select value={episode2} onChange={e => setEpisode2(e.target.value)}>
                    {episodes.map(episode => (
                        <option key={episode.value} value={episode.value} className='bg-gray-800'>{episode.label}</option>
                    ))}
                </select>
                <svg ref={svgRef2} className="w-full h-full"></svg>
            </div>
        </div>

        {/* Sidebar for Node Info */}
        <div className="ml-6 p-4 border-2 border-white w-60 text-white">
            <h2 className="text-lg font-bold">Node Details</h2>
            {selectedNodeData ? (
                <div>
                    <p><strong>Name:</strong> {selectedNodeData.name}</p>
                    <p><strong>Value:</strong> {selectedNodeData.value}</p>
                    <p><strong>Connections:</strong></p>
                    <ul>
                        {selectedNodeData.connections.map(connection => (
                            <li key={connection.name}>{connection.name} ({connection.value})</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>Select a node to see details.</p>
            )}
        </div>
    </div>
    );
}

export default Graph;