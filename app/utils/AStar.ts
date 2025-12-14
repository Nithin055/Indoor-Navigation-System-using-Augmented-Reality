import { Node, Edge, Graph } from '../models/types';

export function aStar(graph: Graph, startId: string, endId: string): Node[] | null {
  try {
    const nodes = new Map(graph.nodes.map(node => [node.id, node]));

  if (!nodes.has(startId) || !nodes.has(endId)) {
    return null;
  }
  
  const edges = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (!edges.has(edge.source)) {
      edges.set(edge.source, []);
    }
    if (!edges.has(edge.target)) {
      edges.set(edge.target, []);
    }
    edges.get(edge.source)!.push(edge.target);
    edges.get(edge.target)!.push(edge.source);
  }

  const openSet = new Set([startId]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  gScore.set(startId, 0);

  const fScore = new Map<string, number>();
  fScore.set(startId, heuristic(nodes.get(startId)!, nodes.get(endId)!));

  const closedSet = new Set<string>();
  
  let iteration = 0;
  while (openSet.size > 0) {
    iteration++;
    if (iteration > 100) {
      break;
    }
    
    let currentId = null;
    let minFScore = Infinity;

    for (const id of openSet) {
      if ((fScore.get(id) || Infinity) < minFScore) {
        minFScore = fScore.get(id)!;
        currentId = id;
      }
    }

    if (currentId === null) {
      break;
    }

    if (currentId === endId) {
      return reconstructPath(cameFrom, currentId, nodes);
    }

    openSet.delete(currentId);
    closedSet.add(currentId);

    const neighbors = edges.get(currentId) || [];
    for (const neighborId of neighbors) {
      if (closedSet.has(neighborId)) {
        continue; // Skip already visited nodes
      }
      
      const currentNode = nodes.get(currentId);
      const neighborNode = nodes.get(neighborId);
      
      if (!currentNode || !neighborNode) {
        continue;
      }
      
      const currentGScore = gScore.get(currentId);
      const dist = distance(currentNode, neighborNode);
      const tentativeGScore = (currentGScore !== undefined ? currentGScore : Infinity) + dist;

      if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeGScore);
        fScore.set(neighborId, tentativeGScore + heuristic(neighborNode, nodes.get(endId)!));
        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  return null;
  } catch (error) {
    return null;
  }
}

function reconstructPath(cameFrom: Map<string, string>, currentId: string, nodes: Map<string, Node>): Node[] {
  const totalPath = [nodes.get(currentId)!];
  let current = currentId;
  let iterations = 0;
  while (cameFrom.has(current)) {
    iterations++;
    if (iterations > 10) {
      break;
    }
    current = cameFrom.get(current)!;
    totalPath.unshift(nodes.get(current)!);
  }
  return totalPath;
}

function heuristic(nodeA: Node, nodeB: Node): number {
  return distance(nodeA, nodeB);
}

function distance(nodeA: Node, nodeB: Node): number {
  return Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2) + Math.pow(nodeA.z - nodeB.z, 2));
}
