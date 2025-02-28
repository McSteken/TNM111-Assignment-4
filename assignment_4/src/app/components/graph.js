'use client'


import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const Graph = () => {
    const svgRef1 = useRef();
    const svgRef2 = useRef();
    const [data, setData] = useState();
    const [minEdgeWeight, setMinEdgeWeight] = useState(1);


    useEffect(() => {
        d3.json('StarWarsData/starwars-full-interactions-allCharacters.json').then(data => {
            setData(data);
        });
    }, []);

    
    useEffect(() => {
        if(data){
            renderGraph(svgRef1, data);
            renderGraph(svgRef2, data);
        }
    }, [data, minEdgeWeight]);    


    // render the graph
    function renderGraph(svgRef, graphData){
        const width = 800;
        const height = 800;
        const svg = d3.select(svgRef.current) // select the svg with ref because it is a reference to the svg element
            .attr('width', width)
            .attr('height', height)
            .select('g') // select the group element inside the svg
            .attr('transform', 'translate(0,0)');
        
            svg.selectAll('*').remove(); // clear the svg before rendering the new graph

            const filteredLinks = graphData.links.filter(d => d.value > minEdgeWeight);

            const simulation = d3.forceSimulation(graphData.nodes) // create a new simulation with the nodes
                .force('link', d3.forceLink(filteredLinks).id(d => d.id)) // add a link force to the simulation
                .force('charge', d3.forceManyBody()) // charge is like gravity, it pushes nodes apart
                .force('center', d3.forceCenter(width / 2, height / 2)); // center the nodes in the middle of the svg
            
            const link = svg.append('g') // create a new group for the links
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6)
                .selectAll('line')
                .data(filteredLinks)
                .join('line')
                .attr('stroke-width', d => Math.sqrt(d.value)); // set the width of the line based on the value of the link

            const node = svg.append('g') // create a new group for the nodes
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .selectAll('circle')
                .data(graphData.nodes)
                .join('circle')
                .attr('r', 5)
                .attr('fill', d => d.color) // set the color of the node based on the color property of the node
                .call(drag(simulation)); // make the nodes draggable

            node.append('title').text(d => d.name); // add a name to the node

            simulation.on('tick', () => { // listen for the tick event and update the position of the nodes and links
                link.attr('x1', d => d.source.x) 
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node.attr('cx', d => d.x) 
                    .attr('cy', d => d.y);
            }
        );

        function drag(simulation) {
            return d3.drag()
                .on('start', d => {
                    if (!d.active) simulation.alphaTarget(0.3).restart(); // adds alpha that is the cooling rate 

                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', d => {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on('end', d => {
                    if (!d3.event.active) simulation.alphaTarget(0);

                    d.fx = null;
                    d.fy = null;
                });
        }  
    }
}

export default Graph;
