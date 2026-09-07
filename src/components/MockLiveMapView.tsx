import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Animated, Platform } from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion, MapTypes } from './MapViewBase';
import { DummyLiveMapView } from './DummyLiveMapView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Types ---
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MockLiveMapViewProps {
  routeCoordinates?: Coordinate[];
  markerImage?: any; // e.g. require('./car-icon.png')
  markerColor?: string;
  lineColor?: string;
  updateIntervalMs?: number;
  mapType?: MapTypes;
}

// --- Default Mock Data ---
const DEFAULT_ROUTE: Coordinate[] = [
  { latitude: 37.78825, longitude: -122.4324 },
  { latitude: 37.78850, longitude: -122.4310 },
  { latitude: 37.78900, longitude: -122.4300 },
  { latitude: 37.78950, longitude: -122.4290 },
  { latitude: 37.79000, longitude: -122.4280 },
  { latitude: 37.79050, longitude: -122.4270 },
  { latitude: 37.79150, longitude: -122.4250 },
  { latitude: 37.79250, longitude: -122.4230 },
];

const ASPECT_RATIO = SCREEN_WIDTH / SCREEN_HEIGHT;
const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export const MockLiveMapView: React.FC<MockLiveMapViewProps> = ({
  routeCoordinates = DEFAULT_ROUTE,
  markerImage,
  markerColor = '#FF3B30',
  lineColor = '#007AFF',
  updateIntervalMs = 2000,
  mapType = 'standard',
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs
  const mapRef = useRef<MapView>(null);
  
  // Use AnimatedRegion for smooth marker movement
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: routeCoordinates[0]?.latitude || 0,
      longitude: routeCoordinates[0]?.longitude || 0,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  ).current;

  // Initial Region setup
  const initialRegion = {
    latitude: routeCoordinates[0]?.latitude || 37.78825,
    longitude: routeCoordinates[0]?.longitude || -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  // --- Simulation Logic ---
  
  const moveToCoordinate = useCallback((index: number) => {
    if (index >= routeCoordinates.length) return;
    
    const nextCoord = routeCoordinates[index];
    
    // Animate marker
    if (Platform.OS === 'android') {
      // Android specific marker animation if needed, but AnimatedRegion works cross-platform
      animatedCoordinate.timing({
        latitude: nextCoord.latitude,
        longitude: nextCoord.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
        duration: updateIntervalMs,
        useNativeDriver: false,
      }).start();
    } else {
       animatedCoordinate.timing({
        latitude: nextCoord.latitude,
        longitude: nextCoord.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
        duration: updateIntervalMs,
        useNativeDriver: false,
      }).start();
    }

    // Animate Map Camera to follow marker
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: nextCoord.latitude,
          longitude: nextCoord.longitude,
        },
        pitch: 45, // Add a slight tilt for a "navigation" feel
        heading: 0,
      },
      { duration: updateIntervalMs }
    );
  }, [animatedCoordinate, routeCoordinates, updateIntervalMs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && currentIndex < routeCoordinates.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= routeCoordinates.length) {
            setIsPlaying(false);
            return prev;
          }
          moveToCoordinate(nextIndex);
          return nextIndex;
        });
      }, updateIntervalMs);
    } else if (currentIndex >= routeCoordinates.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentIndex, routeCoordinates.length, updateIntervalMs, moveToCoordinate]);


  // --- Control Handlers ---

  const handlePlayPause = () => {
    if (currentIndex >= routeCoordinates.length - 1) {
      // Reset if at the end before playing
      handleReset();
      setTimeout(() => setIsPlaying(true), 500); // Give it time to reset
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    
    const startCoord = routeCoordinates[0];
    if (startCoord) {
      // Snap marker back
      animatedCoordinate.setValue({
        latitude: startCoord.latitude,
        longitude: startCoord.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      
      // Animate map back
      mapRef.current?.animateCamera(
        {
          center: {
             latitude: startCoord.latitude,
             longitude: startCoord.longitude,
          },
          pitch: 0,
        },
        { duration: 1000 }
      );
    }
  };

  // Traveled route path
  const pathTraveled = routeCoordinates.slice(0, currentIndex + 1);
  const pathUpcoming = routeCoordinates.slice(currentIndex);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <DummyLiveMapView 
          routeCoordinates={routeCoordinates} 
          markerColor={markerColor}
          initialLocation={routeCoordinates[0]}
        />
        <View style={[styles.controlsContainer, { bottom: 80 }]}>
           <Text style={styles.buttonTextDark}>Web Simulation View</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        showsUserLocation={false}
      >
        {/* Full Route Traveled */}
        <Polyline
          coordinates={pathTraveled}
          strokeColor={lineColor}
          strokeWidth={5}
          lineJoin="round"
        />
        
        {/* Upcoming Route */}
        <Polyline
          coordinates={pathUpcoming}
          strokeColor="rgba(0, 122, 255, 0.3)" // Faded blue for upcoming
          strokeWidth={5}
          lineJoin="round"
          lineDashPattern={[10, 10]} // Dashed line for upcoming
        />

        {/* Live Animated Marker */}
        <Marker.Animated
          coordinate={animatedCoordinate}
          image={markerImage}
          pinColor={markerImage ? undefined : markerColor}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {/* Custom marker view can go here if not using image/pinColor */}
        </Marker.Animated>
      </MapView>

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.button, isPlaying ? styles.buttonPause : styles.buttonPlay]} 
          onPress={handlePlayPause}
        >
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonReset} onPress={handleReset}>
          <Text style={styles.buttonTextDark}>Reset</Text>
        </TouchableOpacity>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            Step: {currentIndex + 1} / {routeCoordinates.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPlay: {
    backgroundColor: '#34C759', // Green
  },
  buttonPause: {
    backgroundColor: '#FF9500', // Orange
  },
  buttonReset: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E5E5EA', // Light Gray
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextDark: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
