import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, Dimensions, Modal, ScrollView } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import StepService from '../services/StepService';
import CameraScanner from '../components/CameraScanner';

import ThreeARArrows from '../components/ThreeARArrows';
import MiniMap from '../components/MiniMap';
import VoiceService from '../services/VoiceService';
import GraphService from '../services/GraphService';
import { aStar } from '../utils/AStar';
import { Graph, Node } from '../models/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = 'demo_mode';

const ARScreen: React.FC = () => {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [path, setPath] = useState<Node[] | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [startRoom, setStartRoom] = useState('');
  const [endRoom, setEndRoom] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [stepsWalked, setStepsWalked] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [heading, setHeading] = useState(0);
  const checkMovementTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentNodeIndexRef = React.useRef(0);

    useEffect(() => {
    currentNodeIndexRef.current = currentNodeIndex;
  }, [currentNodeIndex]);

  useEffect(() => {
    const init = async () => {
            const loadedGraph = await GraphService.loadGraph();
      setGraph(loadedGraph);

      try {
        const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
        if (value !== null) {
          setIsDemoMode(JSON.parse(value));
        }
      } catch (e) {
        console.error('Failed to load demo mode setting.', e);
      }
    };
    init();
  }, []);

  useEffect(() => {
        if (isDemoMode && graph) {
      const demoPath = aStar(graph, '101', '204');
      if (demoPath) {
        setPath(demoPath);
        setStartRoom('101');
        setEndRoom('204');
        setCurrentNodeIndex(0);
        setIsNavigating(true);
      }
    } else {
      setPath(null);
    }
  }, [graph, isDemoMode]);

    useEffect(() => {
    setPath(null);
    setCurrentNodeIndex(0);
    setIsNavigating(false);
    VoiceService.stop();
  }, [startRoom, endRoom]);

    useEffect(() => {
    if (!isNavigating || !path) {
      StepService.stop();
      return;
    }

    StepService.start();

    const unsubscribe = StepService.subscribe((totalSteps) => {
      // Since StepService counts from 0, we can add to our local offset if needed,
      // but here we just use the service's count directly or relative to start.
      // However, we need to handle the "8 steps per node" logic.

      // Let's assume StepService is reset when navigation starts.
      // We'll track local increments.
      setStepsWalked(prev => prev + 1);
      setIsMoving(true); // Treat any step as movement

      // Reset moving flag after a delay
      if (checkMovementTimeoutRef.current) clearTimeout(checkMovementTimeoutRef.current);
      checkMovementTimeoutRef.current = setTimeout(() => setIsMoving(false), 2000);

      // Navigation Logic
      if (currentNodeIndex < path.length - 1) {
        // Check if we haven't reached the end node
        const stepsInCurrentSegment = totalSteps % 8; // Simplified logic: 8 steps per node? 
        // Actually, we need to track steps relative to current node.

        // Let's rely on total steps for now or improve logic:
        // Every 8 steps, advance one node.
        const expectedNodeIndex = Math.floor(totalSteps / 8);

        // Use Ref to get the latest index without stale closures
        const currentIndex = currentNodeIndexRef.current;

        if (expectedNodeIndex > currentIndex && expectedNodeIndex < path.length) {
          // IMMEDIATE UPDATE to prevent race conditions during rapid steps
          currentNodeIndexRef.current = expectedNodeIndex;

          const nextIndex = expectedNodeIndex;
          setCurrentNodeIndex(nextIndex);

          if (nextIndex === path.length - 1) {
            setIsNavigating(false);
            StepService.stop();
            VoiceService.speak(`You have arrived at ${path[nextIndex].name}`);
            Alert.alert(
              'Destination Reached!',
              `You have arrived at ${path[nextIndex].name}`,
              [{
                text: 'OK', onPress: () => {
                  setPath(null);
                  setCurrentNodeIndex(0);
                  setStepsWalked(0);
                }
              }]
            );
          } else {
            const nextNode = path[nextIndex];
            VoiceService.speak(`Approaching ${nextNode.name}`);
          }
        }
      }
    });

    return () => {
      StepService.stop();
      unsubscribe();
    };
  }, [isNavigating, path]); // dependency on currentNodeIndex removed to avoid re-subscribing loop

    useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      let h = Math.atan2(data.y, data.x) * (180 / Math.PI);
      h = (h + 360) % 360;
      setHeading(h);
    });
    return () => subscription && subscription.remove();
  }, []);

  const calculateDistance = (path: Node[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      const dz = path[i + 1].z - path[i].z;
      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return totalDistance;
  };

  const handleFindPath = () => {
    if (!startRoom || !endRoom) {
      Alert.alert('Missing Information', 'Please select both starting room and destination');
      return;
    }

    if (graph) {
      try {
        const newPath = aStar(graph, startRoom, endRoom);
        setPath(newPath);
        if (newPath) {
          setCurrentNodeIndex(0);
          StepService.reset(); // Reset steps for new path
          setIsNavigating(true);
          const distance = calculateDistance(newPath);
          const estimatedTime = Math.ceil(distance / 1.4);
          VoiceService.speak(`Starting navigation to ${graph.nodes.find(n => n.id === endRoom)?.name}. Follow the arrows.`);
          Alert.alert(
            'Navigation Started',
            `Route: ${newPath.map(n => n.name).join(' → ')}\n\nDistance: ${distance.toFixed(1)} meters\nEstimated Time: ${estimatedTime} seconds\n\nFollow the arrows as you move!`,
            [{ text: 'Start Walking', style: 'default' }]
          );
        } else {
          Alert.alert('No Path Found', `Unable to find a route from room "${startRoom}" to "${endRoom}".\n\nAvailable rooms: 101, 102, 103, 104, 201, 202, 203, 204, lobby, stairs, elevator, restroom`);
        }
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'An error occurred while finding the path');
      }
    } else {
      Alert.alert('Error', 'Map data not loaded');
    }
  };

  const handleRoomScan = (room: string) => {
    setStartRoom(room);
  };

  const getAvailableRooms = () => {
    if (!graph) return [];
    return graph.nodes.map(node => ({ id: node.id, name: node.name }));
  };

  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer} pointerEvents="box-none">
        <CameraScanner onRoomScan={handleRoomScan} />
      </View>
      {path && currentNodeIndex < path.length && (
        <>
          <ThreeARArrows
            path={path.slice(currentNodeIndex)}
            isMoving={isMoving}
            heading={heading}
          />

          {/* Turn Indicator Overlay */}
          <View style={styles.turnIndicatorContainer}>
            {(() => {
              if (path.length <= currentNodeIndex + 1) return <Text style={styles.turnText}>Arrived</Text>;

              const start = path[currentNodeIndex];
              const next = path[currentNodeIndex + 1];
              const dx = next.x - start.x;
              const dy = next.y - start.y;

              // Path angle in world (0 = East, 90 = South)
              let pathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
              // Normalize
              pathAngle = (pathAngle + 360) % 360;
              // Device Heading (0 = North, 90 = East)
              // Convert Heading to standard math angle (0=East, 90=North) for comparison?
              // No, let's convert Path Angle to Bearing.
              // Map: Y is Down? Usually.
              // If Y is Down. East(0,1) -> atan2(1,0) = 90? No, atan2(0,1)=0.
              // South(1,0) -> atan2(1,0) = 90.
              // West(-1,0) -> 180.
              // North(0,-1) -> -90 (270).

              // Compass Bearing: N=0, E=90, S=180, W=270.
              // Path(0) [East] -> Bearing 90.
              // Path(90) [South] -> Bearing 180.
              // Path(180) [West] -> Bearing 270.
              // Path(270) [North] -> Bearing 0.

              // Formula: Bearing = (PathAngle + 90) % 360?
              // 0 -> 90. OK.
              // 90 -> 180. OK.
              // 270 (-90) -> 0. OK.

              const pathBearing = (pathAngle + 90 + 360) % 360;

              // Relative Bearing (Turn Angle)
              // If Heading 0, Target 90 (East). Turn = +90 (Right).
              // If Heading 0, Target 270 (West). Turn = -90 (Left).

              let diff = pathBearing - heading;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
              // diff is now -180 to 180.
              // 0 = Straight. 
              // > 0 = Right. 
              // < 0 = Left.

              let direction = "↑ Go Straight";
              let color = "#4CAF50"; // Green

              if (diff > 20) {
                direction = "↱ Turn Right";
                color = "#FF9800"; // Orange
              } else if (diff < -20) {
                direction = "↰ Turn Left";
                color = "#FF9800"; // Orange
              }

              // If very close to arrival, check if we are facing it
              if (currentNodeIndex === path.length - 2) {
                const finalDist = Math.sqrt(dx * dx + dy * dy);
                if (finalDist < 5) {
                  // Only say "Arriving" if we are roughly facing the target
                  if (Math.abs(diff) <= 20) {
                    direction = "Arriving";
                    color = "#2196F3";
                  }
                }
              }

              return (
                <View style={[styles.turnCard, { backgroundColor: color }]}>
                  <Text style={styles.turnText}>{direction}</Text>
                  <Text style={styles.subText}>
                    {Math.round(Math.abs(diff))}° relative
                  </Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.pathIndicator}>
            <Text style={styles.pathText}>
              {isNavigating && currentNodeIndex < path.length - 1
                ? `Next: ${path[currentNodeIndex + 1]?.name}`
                : `Destination: ${path[path.length - 1]?.name}`}
            </Text>
            {isNavigating && (
              <>
                <Text style={styles.pathSubtext}>
                  {currentNodeIndex + 1} of {path.length} waypoints
                </Text>
                <Text style={styles.pathSubtext}>
                  Steps: {stepsWalked}
                </Text>
              </>
            )}
          </View>
          <View style={styles.miniMapContainer}>
            <MiniMap graph={graph} path={path} currentNodeIndex={currentNodeIndex} width={120} height={120} />
          </View>
        </>
      )}
      <View style={styles.controlsContainer} pointerEvents="auto">
        <View style={styles.inputRow}>
          <Text style={styles.label}>From:</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.pickerText}>
              {startRoom ? graph?.nodes.find(n => n.id === startRoom)?.name : 'Select Room'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.label}>To:</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.pickerText}>
              {endRoom ? graph?.nodes.find(n => n.id === endRoom)?.name : 'Select Room'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.findButton} onPress={handleFindPath}>
          <Text style={styles.findButtonText}>Find Navigation Path</Text>
        </TouchableOpacity>
        <View style={styles.quickButtons}>
          <TouchableOpacity style={styles.quickButton} onPress={() => {
            setStartRoom('101');
            setEndRoom('204');
            setTimeout(() => {
              if (graph) {
                const newPath = aStar(graph, '101', '204');
                setPath(newPath);
                if (newPath) {
                  const distance = calculateDistance(newPath);
                  const estimatedTime = Math.ceil(distance / 1.4);
                  Alert.alert('Navigation Path Found', `Route: ${newPath.map(n => n.name).join(' → ')}\n\nDistance: ${distance.toFixed(1)} meters\nEstimated Time: ${estimatedTime} seconds`, [{ text: 'Start Navigation', style: 'default' }]);
                }
              }
            }, 100);
          }}>
            <Text style={styles.quickButtonText}>101 → 204</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => {
            setStartRoom('102');
            setEndRoom('restroom');
            setTimeout(() => {
              if (graph) {
                const newPath = aStar(graph, '102', 'restroom');
                setPath(newPath);
                if (newPath) {
                  const distance = calculateDistance(newPath);
                  const estimatedTime = Math.ceil(distance / 1.4);
                  Alert.alert('Navigation Path Found', `Route: ${newPath.map(n => n.name).join(' → ')}\n\nDistance: ${distance.toFixed(1)} meters\nEstimated Time: ${estimatedTime} seconds`, [{ text: 'Start Navigation', style: 'default' }]);
                }
              }
            }, 100);
          }}>
            <Text style={styles.quickButtonText}>102 → Restroom</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => {
            setStartRoom('201');
            setEndRoom('elevator');
            setTimeout(() => {
              if (graph) {
                const newPath = aStar(graph, '201', 'elevator');
                setPath(newPath);
                if (newPath) {
                  const distance = calculateDistance(newPath);
                  const estimatedTime = Math.ceil(distance / 1.4);
                  Alert.alert('Navigation Path Found', `Route: ${newPath.map(n => n.name).join(' → ')}\n\nDistance: ${distance.toFixed(1)} meters\nEstimated Time: ${estimatedTime} seconds`, [{ text: 'Start Navigation', style: 'default' }]);
                }
              }
            }, 100);
          }}>
            <Text style={styles.quickButtonText}>201 → Elevator</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* From Room Picker Modal */}
      <Modal visible={showFromPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Starting Room</Text>
            <ScrollView style={styles.roomList}>
              {getAvailableRooms().map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomItem}
                  onPress={() => {
                    setStartRoom(room.id);
                    setShowFromPicker(false);
                  }}
                >
                  <Text style={styles.roomItemText}>{room.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFromPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* To Room Picker Modal */}
      <Modal visible={showToPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <ScrollView style={styles.roomList}>
              {getAvailableRooms().map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomItem}
                  onPress={() => {
                    setEndRoom(room.id);
                    setShowToPicker(false);
                  }}
                >
                  <Text style={styles.roomItemText}>{room.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowToPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  turnIndicatorContainer: {
    position: 'absolute',
    top: 150, // Moved down to clear MiniMap (Top Right) and Header
    left: 20, // Add spacing
    right: 20, // Add spacing so it doesn't touch edges
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  turnCard: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  turnText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  pathIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  pathText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pathSubtext: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  findButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  findButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  picker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  roomList: {
    maxHeight: 400,
  },
  roomItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roomItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  miniMapContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default ARScreen;
