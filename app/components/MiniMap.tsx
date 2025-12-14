import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import { Graph, Node, Edge } from '../models/types';

interface MiniMapProps {
    graph: Graph | null;
    path: Node[] | null;
    currentNodeIndex: number;
    width?: number;
    height?: number;
}

const MiniMap: React.FC<MiniMapProps> = ({
    graph,
    path,
    currentNodeIndex,
    width = 150,
    height = 150
}) => {
    if (!graph) return null;

    // Calculate bounds to normalize coordinates
    const { minX, maxX, minY, maxY } = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        graph.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        // Add some padding
        const padding = 5;
        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding
        };
    }, [graph]);

    const mapWidth = maxX - minX;
    const mapHeight = maxY - minY;

    // Scale to fit available width/height ensuring aspect ratio
    const scale = Math.min(width / mapWidth, height / mapHeight);

    // Center the map
    const offsetX = (width - mapWidth * scale) / 2;
    const offsetY = (height - mapHeight * scale) / 2;

    const toScreenX = (x: number) => (x - minX) * scale + offsetX;
    const toScreenY = (y: number) => (y - minY) * scale + offsetY;

    return (
        <View style={[styles.container, { width, height }]}>
            <Svg width={width} height={height}>
                {/* Background */}
                <Rect x="0" y="0" width={width} height={height} fill="rgba(255, 255, 255, 0.8)" rx="10" />

                {/* All Edges (Map Structure) */}
                {graph.edges.map((edge) => {
                    const startNode = graph.nodes.find(n => n.id === edge.source);
                    const endNode = graph.nodes.find(n => n.id === edge.target);
                    if (!startNode || !endNode) return null;

                    return (
                        <Line
                            key={edge.id}
                            x1={toScreenX(startNode.x)}
                            y1={toScreenY(startNode.y)}
                            x2={toScreenX(endNode.x)}
                            y2={toScreenY(endNode.y)}
                            stroke="#ccc"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Path Highlight */}
                {path && path.map((node, index) => {
                    if (index === path.length - 1) return null;
                    const nextNode = path[index + 1];
                    // Don't draw path segments we've already passed
                    // if (index < currentNodeIndex) return null; // Optional: hide passed path

                    // Highlight active segment differently?
                    const isActive = index === currentNodeIndex;

                    return (
                        <Line
                            key={`path-${index}`}
                            x1={toScreenX(node.x)}
                            y1={toScreenY(node.y)}
                            x2={toScreenX(nextNode.x)}
                            y2={toScreenY(nextNode.y)}
                            stroke={index < currentNodeIndex ? "#aaa" : "#007AFF"} // Gray out passed path
                            strokeWidth={isActive ? "4" : "3"}
                        />
                    );
                })}

                {/* Nodes */}
                {graph.nodes.map(node => (
                    <Circle
                        key={node.id}
                        cx={toScreenX(node.x)}
                        cy={toScreenY(node.y)}
                        r="2"
                        fill="#666"
                    />
                ))}

                {/* Current Position Marker */}
                {path && path[currentNodeIndex] && (
                    <Circle
                        cx={toScreenX(path[currentNodeIndex].x)}
                        cy={toScreenY(path[currentNodeIndex].y)}
                        r="6"
                        fill="#FF3B30"
                        stroke="white"
                        strokeWidth="2"
                    />
                )}

                {/* Destination Marker */}
                {path && path.length > 0 && (
                    <Circle
                        cx={toScreenX(path[path.length - 1].x)}
                        cy={toScreenY(path[path.length - 1].y)}
                        r="5"
                        fill="#34C759"
                    />
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
});

export default MiniMap;
