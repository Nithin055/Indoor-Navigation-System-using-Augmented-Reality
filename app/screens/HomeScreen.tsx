import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';


const DARK_MODE_KEY = 'dark_mode';

type RootStackParamList = {
  Home: undefined;
  AR: undefined;
  Admin: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

import GraphService from '../services/GraphService';


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<'college' | 'mall'>('college');

    useFocusEffect(
    React.useCallback(() => {
      const init = async () => {
        // Sync building selection
        setSelectedBuilding(GraphService.getCurrentBuilding());
      };
      init();
    }, [])
  );

    const handleBuildingChange = (building: 'college' | 'mall') => {
    setSelectedBuilding(building);
    GraphService.setBuilding(building);
  };

  const dynamicStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.text]}>Indoor Navigation System</Text>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentButton, selectedBuilding === 'college' && styles.segmentActive]}
          onPress={() => handleBuildingChange('college')}
        >
          <Text style={[styles.segmentText, selectedBuilding === 'college' && styles.segmentTextActive]}>College</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, selectedBuilding === 'mall' && styles.segmentActive]}
          onPress={() => handleBuildingChange('mall')}
        >
          <Text style={[styles.segmentText, selectedBuilding === 'mall' && styles.segmentTextActive]}>Mall</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('AR')}
      >
        <Text style={styles.primaryButtonText}>Start Navigation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, dynamicStyles.secondaryButton]}
        onPress={() => navigation.navigate('Admin')}
      >
        <Text style={[styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>Admin</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, dynamicStyles.secondaryButton]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={[styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 50,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
    width: '80%',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  text: {
    color: '#333',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
  },
  text: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  secondaryButtonText: {
    color: '#0A84FF',
  },
});

export default HomeScreen;
