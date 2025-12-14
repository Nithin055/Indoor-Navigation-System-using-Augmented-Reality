import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = 'demo_mode';
const DARK_MODE_KEY = 'dark_mode';

const SettingsScreen: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const demoValue = await AsyncStorage.getItem(DEMO_MODE_KEY);
        if (demoValue !== null) {
          setIsDemoMode(JSON.parse(demoValue));
        }
        
        const darkValue = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (darkValue !== null) {
          setIsDarkMode(JSON.parse(darkValue));
        }
      } catch (e) {
        console.error('Failed to load settings.', e);
      }
    };
    loadSettings();
  }, []);

  const toggleDemoMode = async (value: boolean) => {
    try {
      setIsDemoMode(value);
      await AsyncStorage.setItem(DEMO_MODE_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save demo mode setting.', e);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save dark mode setting.', e);
    }
  };

  const dynamicStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.text]}>Settings</Text>
      </View>

      <View style={[styles.section, dynamicStyles.section]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, dynamicStyles.text]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, dynamicStyles.subtext]}>
              Switch between light and dark theme
            </Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, dynamicStyles.section]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, dynamicStyles.text]}>Demo Mode</Text>
            <Text style={[styles.settingDescription, dynamicStyles.subtext]}>
              Enable demo navigation path
            </Text>
          </View>
          <Switch 
            value={isDemoMode} 
            onValueChange={toggleDemoMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDemoMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
  },
  text: {
    color: '#000',
  },
  subtext: {
    color: '#666',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
  },
  section: {
    backgroundColor: '#2c2c2e',
  },
  text: {
    color: '#fff',
  },
  subtext: {
    color: '#aaa',
  },
});

export default SettingsScreen;
