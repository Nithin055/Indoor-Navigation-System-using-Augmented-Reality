import AsyncStorage from '@react-native-async-storage/async-storage';
import { Graph } from '../models/types';

const GRAPH_STORAGE_KEY = 'graph_data';

class GraphService {
  private graph: Graph | null = null;
  private currentBuilding: 'college' | 'mall' = 'college';

    setBuilding(building: 'college' | 'mall') {
    if (this.currentBuilding !== building) {
      this.currentBuilding = building;
      this.graph = null;     }
  }

  getCurrentBuilding(): 'college' | 'mall' {
    return this.currentBuilding;
  }

  async loadGraph(forceReset: boolean = false): Promise<Graph> {
    if (this.graph && !forceReset) return this.graph;

    try {
            const storageKey = `${GRAPH_STORAGE_KEY}_${this.currentBuilding}`;

      const savedGraph = await AsyncStorage.getItem(storageKey);

      if (savedGraph && !forceReset) {
        this.graph = JSON.parse(savedGraph);
      } else {
        if (this.currentBuilding === 'mall') {
          this.graph = require('../assets/mall.json');
        } else {
          this.graph = require('../assets/graph.json');
        }
      }
      return this.graph!;
    } catch (error) {
      console.error('Failed to load graph:', error);
            this.graph = require('../assets/graph.json');
      return this.graph!;
    }
  }

  async saveGraph(graph: Graph): Promise<void> {
    this.graph = graph;
    const storageKey = `${GRAPH_STORAGE_KEY}_${this.currentBuilding}`;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(graph));
    } catch (e) {
      console.error('Failed to save graph:', e);
    }
  }

  }

export default new GraphService();
