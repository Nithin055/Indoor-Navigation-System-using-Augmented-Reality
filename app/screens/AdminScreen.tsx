import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import GraphService from '../services/GraphService';
import { Graph, Node, Edge } from '../models/types';
import * as Clipboard from 'expo-clipboard';

const AdminScreen: React.FC = () => {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

    const currentBuilding = GraphService.getCurrentBuilding();

  useEffect(() => {
    const initGraph = async () => {
      const loadedGraph = await GraphService.loadGraph();
      setGraph(loadedGraph);
    };
    initGraph();
  }, []);

  const handleSave = async () => {
    if (graph) {
      await GraphService.saveGraph(graph);
      Alert.alert('Success', `Saved to ${currentBuilding} storage!`);
    }
  };

  const handleExport = async () => {
    if (graph) {
      await Clipboard.setStringAsync(JSON.stringify(graph, null, 2));
      Alert.alert('Copied', 'Graph JSON copied to clipboard!');
    }
  };

  const handleNodePress = (nodeId: string) => {
    if (mode === 'edit') {
      setSelectedNodeId(nodeId);
    }
  };

  const moveNode = (dx: number, dy: number) => {
    if (!selectedNodeId || !graph) return;

    const newNodes = graph.nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, x: n.x + dx, y: n.y + dy };
      }
      return n;
    });
    setGraph({ ...graph, nodes: newNodes });
  };

  const renderMap = () => {
    if (!graph) return null;

    // Simple scaling
    const width = Dimensions.get('window').width - 40;
    const height = 300;
    const scale = 5;

    return (
      <View style={styles.mapContainer}>
        <Svg width={width} height={height}>
          {graph.edges.map(e => {
            const start = graph.nodes.find(n => n.id === e.source);
            const end = graph.nodes.find(n => n.id === e.target);
            if (!start || !end) return null;
            return (
              <Line
                key={e.id}
                x1={start.x * scale} y1={start.y * scale}
                x2={end.x * scale} y2={end.y * scale}
                stroke="#ccc"
                strokeWidth="2"
              />
            );
          })}
          {graph.nodes.map(n => (
            <Circle
              key={n.id}
              cx={n.x * scale}
              cy={n.y * scale}
              r={selectedNodeId === n.id ? "8" : "5"}
              fill={selectedNodeId === n.id ? "#007AFF" : "red"}
              onPress={() => handleNodePress(n.id)}
            />
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Visual Map Editor</Text>

      <View style={styles.toolbar}>
        <Button title={mode === 'view' ? "Switch to Edit" : "Switch to View"} onPress={() => setMode(prev => prev === 'view' ? 'edit' : 'view')} />
        <Button title="Save" onPress={handleSave} />
        <Button title="Export JSON" onPress={handleExport} />
      </View>

      {renderMap()}

      {mode === 'edit' && selectedNodeId && (
        <View style={styles.editorControls}>
          <Text>Selected: {selectedNodeId}</Text>
          <View style={styles.moveControls}>
            <TouchableOpacity style={styles.moveBtn} onPress={() => moveNode(0, -1)}><Text>↑</Text></TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity style={styles.moveBtn} onPress={() => moveNode(-1, 0)}><Text>←</Text></TouchableOpacity>
              <TouchableOpacity style={styles.moveBtn} onPress={() => moveNode(1, 0)}><Text>→</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.moveBtn} onPress={() => moveNode(0, 1)}><Text>↓</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'view' && graph && (
        <>
          <Text style={styles.title}>Data View</Text>
          <Text>Nodes: {graph.nodes.length}</Text>
          <Text>Edges: {graph.edges.length}</Text>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mapContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    backgroundColor: '#f0f0f0'
  },
  editorControls: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center'
  },
  moveControls: {
    alignItems: 'center',
    marginTop: 10
  },
  row: {
    flexDirection: 'row',
  },
  moveBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
});

export default AdminScreen;
