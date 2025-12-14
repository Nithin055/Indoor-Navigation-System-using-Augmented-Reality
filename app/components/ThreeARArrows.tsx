import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Node } from '../models/types';
import { View, StyleSheet } from 'react-native';
import * as THREE from 'three';

interface ThreeARArrowsProps {
    path: Node[];
    isMoving: boolean;
    heading: number;
}

// Route Line: A continuous tube connecting all path nodes
const RouteLine = ({ path, heading }: { path: Node[], heading: number }) => {
    const geometry = useMemo(() => {
        if (!path || path.length < 2) return null;

        const points: THREE.Vector3[] = [];
        const startNode = path[0];
        const scale = 0.05; // Scale factor to map meters to AR units

        // We only render the next few nodes to keep the AR scene clean
        // and to avoid issues with long-distance coordinate mapping errors.
        const renderLimit = Math.min(path.length, 6);

        for (let i = 0; i < renderLimit; i++) {
            const node = path[i];

            // Relative position in World (Graph) Space
            const dx = node.x - startNode.x;
            const dy = node.y - startNode.y;

            // Apply Heading Rotation to map 'World' to 'Camera'
            // We rotate the world around the user so the "North" aligns with the true North,
            // effectively placing the path correctly relative to the camera view.
            const rad = -heading * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // Standard rotation
            const camX = dx * cos - dy * sin;
            const camZ_raw = dx * sin + dy * cos;

            // Map to ThreeJS coordinates: 
            // X -> X (Right)
            // Y (Up) -> -1.0 (Fixed Height, slightly below ground/waist)
            // Z (Forward) -> camZ_raw (Assuming Graph Y-Axis aligns with -Z after rotation)
            // Note: If Graph Y grows downward (screen coords), and 'North' is Up, then standard map logic applies.
            // We invert Z here if needed. Based on previous HUD arrow logic, camZ_raw seemed consistent.

            // Just drop the y-height slightly to -1.5 (floor level relative to camera at 0)
            points.push(new THREE.Vector3(camX * scale, -1.5, camZ_raw * scale));
        }

        if (points.length < 2) return null;

        // Create a smooth curve passing through these points
        const curve = new THREE.CatmullRomCurve3(points);
        // Create tube: path, segments=64, radius=0.1, radialSegments=8, closed=false
        return new THREE.TubeGeometry(curve, 64, 0.1, 8, false);

    }, [path, heading]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry}>
            {/* Google Maps Blue-ish color */}
            <meshBasicMaterial color="#4285F4" opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
    );
};

const Scene = ({ path, heading, isMoving }: { path: Node[], heading: number, isMoving: boolean }) => {
    return (
        <>
            <ambientLight intensity={1.0} />

            {/* The 3D Route Line */}
            <RouteLine path={path} heading={heading} />

            {/* Start Point Indicator (Green Ring at feet) */}
            <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.4, 32]} />
                <meshBasicMaterial color="#00FF00" opacity={0.8} transparent />
            </mesh>
        </>
    );
};

const ThreeARArrows: React.FC<ThreeARArrowsProps> = ({ path, heading, isMoving }) => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas
                camera={{ position: [0, 0, 0], fov: 75 }}
                gl={{ alpha: true }}
                onCreated={(state) => {
                    // transparent background
                    state.gl.setClearColor(0x000000, 0);
                }}
            >
                <Scene path={path} heading={heading} isMoving={isMoving} />
            </Canvas>
        </View>
    );
};

export default ThreeARArrows;
