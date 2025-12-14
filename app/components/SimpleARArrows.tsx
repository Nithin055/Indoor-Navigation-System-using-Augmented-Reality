import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import { Node } from '../models/types';


interface SimpleARArrowsProps {
  path: Node[];
  screenWidth: number;
  screenHeight: number;
  isMoving: boolean;
}

const SimpleARArrows: React.FC<SimpleARArrowsProps> = ({ path, screenWidth, screenHeight, isMoving }) => {
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [pathHeading, setPathHeading] = useState(0);
  const [smoothedHeading, setSmoothedHeading] = useState(0);



  // Calculate the direction of the first segment of the path
  useEffect(() => {
    if (path.length >= 2) {
      const dx = path[1].x - path[0].x;
      const dy = path[1].y - path[0].y;
      let heading = Math.atan2(dy, dx) * (180 / Math.PI);
      heading = (heading + 360) % 360;
      setPathHeading(heading);
    }
  }, [path]);

  // Track device compass heading with smoothing
  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener((data) => {
      let heading = Math.atan2(data.y, data.x) * (180 / Math.PI);
      heading = (heading + 360) % 360;
      setDeviceHeading(heading);
    });

    return () => subscription && subscription.remove();
  }, []);

  // Smooth the heading using Kalman Filter
  useEffect(() => {
    // We'll just stick to the previous robust logic for now to ensure stability, 
    // as implementing a full Sin/Cos Kalman requires more state properties in this component.
    // Use alpha smoothing which handles wrapping correctly.

    const diff = (deviceHeading - smoothedHeading + 540) % 360 - 180;

    const alpha = 0.1;
    const newSmoothed = smoothedHeading + alpha * diff;
    setSmoothedHeading(newSmoothed);

  }, [deviceHeading]);

  // Calculate turn direction
  const getTurnDirection = () => {
    let diff = pathHeading - deviceHeading;
    // Normalize to -180 to 180
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    if (Math.abs(diff) < 30) return 'straight';
    // When diff is positive, you need to turn clockwise (right)
    // When diff is negative, you need to turn counter-clockwise (left)
    if (diff > 0) return 'left';
    return 'right';
  };

  const turnDirection = getTurnDirection();

  // Generate arrow positions along the path
  const generateArrowPositions = () => {
    const positions = [];

    for (let i = 0; i < path.length - 1; i++) {
      const startNode = path[i];
      const endNode = path[i + 1];

      const dx = endNode.x - startNode.x;
      const dy = endNode.y - startNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Show arrows along entire path with consistent spacing
      const arrowCount = Math.max(2, Math.floor(distance / 2.5));

      for (let j = 1; j <= arrowCount; j++) {
        const t = j / (arrowCount + 1);
        const x = startNode.x + (endNode.x - startNode.x) * t;
        const y = startNode.y + (endNode.y - startNode.y) * t;

        // Scale to screen coordinates with perspective
        // Arrows further away appear higher on screen and smaller
        const normalizedX = x / 55; // 0 to 1
        const normalizedY = y / 25; // 0 to 1

        // Map to screen with perspective (further = higher on screen)
        const screenX = normalizedX * screenWidth * 0.8 + screenWidth * 0.1;
        const screenY = screenHeight * 0.7 - (normalizedY * screenHeight * 0.5);

        // Calculate world direction of this path segment
        const worldAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Rotate arrow based on smoothed heading - arrow points to destination
        // Subtract 90 because SVG arrow points right by default, we want it to point up at 0 degrees
        const arrowAngle = worldAngle - smoothedHeading;

        // Scale arrows based on distance (further = smaller)
        const scale = 1 - (normalizedY * 0.5); // 1.0 to 0.5

        positions.push({ x: screenX, y: screenY, angle: arrowAngle, scale, key: `${i}-${j}` });
      }
    }

    return positions;
  };

  const arrows = generateArrowPositions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Turn Direction Indicator */}
      <View style={styles.turnIndicator}>
        {turnDirection === 'left' && (
          <View style={styles.turnBox}>
            <Svg width="60" height="60" viewBox="0 0 60 60">
              <Path d="M 40 30 L 20 15 L 20 45 Z" fill="#FF9500" stroke="#CC7700" strokeWidth="2" />
            </Svg>
            <View style={styles.turnTextBox}>
              <RNText style={styles.turnText}>← TURN LEFT</RNText>
            </View>
          </View>
        )}
        {turnDirection === 'right' && (
          <View style={styles.turnBox}>
            <Svg width="60" height="60" viewBox="0 0 60 60">
              <Path d="M 20 30 L 40 15 L 40 45 Z" fill="#FF9500" stroke="#CC7700" strokeWidth="2" />
            </Svg>
            <View style={styles.turnTextBox}>
              <RNText style={styles.turnText}>TURN RIGHT →</RNText>
            </View>
          </View>
        )}
        {turnDirection === 'straight' && (
          <View style={styles.turnBox}>
            <Svg width="60" height="60" viewBox="0 0 60 60">
              <Path d="M 30 15 L 15 35 L 25 35 L 25 45 L 35 45 L 35 35 L 45 35 Z" fill="#34C759" stroke="#2A9D47" strokeWidth="2" />
            </Svg>
            <View style={styles.turnTextBox}>
              <RNText style={[styles.turnText, { color: '#34C759' }]}>↑ GO STRAIGHT</RNText>
            </View>
          </View>
        )}
      </View>

      {arrows.map((arrow) => {
        const size = 80 * arrow.scale;
        const offset = size / 2;
        return (
          <View
            key={arrow.key}
            style={[
              styles.arrow,
              {
                left: arrow.x - offset,
                top: arrow.y - offset,
                width: size,
                height: size,
                transform: [
                  { rotate: `${arrow.angle}deg` },
                  { scale: arrow.scale }
                ],
              },
            ]}
          >
            <Svg width={size} height={size} viewBox="0 0 80 80">
              {/* Large curved chevron arrow - color changes based on movement */}
              <Path
                d="M 65 40 Q 45 25 30 15 L 30 25 Q 40 32 52 40 Q 40 48 30 55 L 30 65 Q 45 55 65 40 Z"
                fill={isMoving ? "#00FF00" : "#FF9500"}
                stroke={isMoving ? "#004400" : "#CC7700"}
                strokeWidth="2.5"
                opacity="0.9"
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnIndicator: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  turnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
  },
  turnTextBox: {
    marginLeft: 10,
  },
  turnText: {
    color: '#FF9500',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SimpleARArrows;
