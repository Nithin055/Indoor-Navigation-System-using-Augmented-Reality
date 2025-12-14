import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React from 'react';
import Navigation from './app/navigation';

/**
 * Main application component that serves as the entry point for the Indoor Navigation System.
 * Wraps the entire app with necessary providers and sets up the navigation.
 */
function App() {
  return <Navigation />;
}

export default registerRootComponent(App);
