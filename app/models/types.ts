export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}
