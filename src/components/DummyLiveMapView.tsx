import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Types ---
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DummyLiveMapViewProps {
  initialLocation?: Coordinate;
  routeCoordinates?: Coordinate[];
  markerColor?: string;
  onLocationChange?: (location: Coordinate) => void;
}

// --- Default Data ---
const DEFAULT_INITIAL_LOCATION: Coordinate = { latitude: 37.7749, longitude: -122.4194 };
const DEFAULT_ROUTE: Coordinate[] = [
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7755, longitude: -122.4180 },
  { latitude: 37.7760, longitude: -122.4170 },
  { latitude: 37.7765, longitude: -122.4150 },
  { latitude: 37.7770, longitude: -122.4140 },
  { latitude: 37.7780, longitude: -122.4120 },
];

export const DummyLiveMapView: React.FC<DummyLiveMapViewProps> = ({
  initialLocation = DEFAULT_INITIAL_LOCATION,
  routeCoordinates = DEFAULT_ROUTE,
  markerColor = '#007AFF',
  onLocationChange,
}) => {
  // State
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [speed, setSpeed] = useState(0);
  
  // Animation values for map movement
  const mapPanX = useRef(new Animated.Value(0)).current;
  const mapPanY = useRef(new Animated.Value(0)).current;
  
  // Animation for marker pulsating effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Refs for tracking current location
  const locationRef = useRef<Coordinate>(initialLocation);

  const currentLocation = routeCoordinates[currentCoordIndex] || initialLocation;

  // --- Map Coordinate Conversion Simulation ---
  // Simplistic mapping of lat/long to x/y coordinates relative to a center point.
  const mapScale = 100000; // Arbitrary scale factor to make lat/long differences visible
  
  const getXY = useCallback((coord: Coordinate, centerCoord: Coordinate) => {
    return {
      x: (coord.longitude - centerCoord.longitude) * mapScale,
      y: (centerCoord.latitude - coord.latitude) * mapScale, // Invert Y
    };
  }, []);

  // --- Animation Setup ---
  useEffect(() => {
    // Pulsating effect for the marker
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (routeCoordinates.length === 0) return;

    const moveInterval = setInterval(() => {
      setCurrentCoordIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % routeCoordinates.length;
        const newLocation = routeCoordinates[nextIndex];
        locationRef.current = newLocation;
        
        // Simulate speed (random between 20 and 40 km/h)
        setSpeed(Math.floor(Math.random() * 20) + 20);

        if (onLocationChange) {
          onLocationChange(newLocation);
        }

        // Animate map panning if recentered
        const targetXY = getXY(newLocation, initialLocation);
        
        Animated.timing(mapPanX, {
          toValue: -targetXY.x,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        Animated.timing(mapPanY, {
          toValue: -targetXY.y,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(moveInterval);
  }, [routeCoordinates, initialLocation, getXY, onLocationChange, mapPanX, mapPanY]);


  // --- Event Handlers ---
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  
  const handleRecenter = () => {
    const targetXY = getXY(currentLocation, initialLocation);
    Animated.parallel([
      Animated.timing(mapPanX, {
        toValue: -targetXY.x,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(mapPanY, {
        toValue: -targetXY.y,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
    setZoomLevel(1);
  };

  // --- Rendering ---
  
  const renderGrid = () => {
    const gridSize = 50;
    const lines = [];
    const numLines = 40; 
    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      // Vertical lines
      lines.push(
        <Line key={`v-${i}`} x1={i * gridSize} y1={-1000} x2={i * gridSize} y2={1000} stroke="#e0e0e0" strokeWidth="1" />
      );
      // Horizontal lines
      lines.push(
        <Line key={`h-${i}`} x1={-1000} y1={i * gridSize} x2={1000} y2={i * gridSize} stroke="#e0e0e0" strokeWidth="1" />
      );
    }
    return <G>{lines}</G>;
  };

  const renderRoute = () => {
    if (routeCoordinates.length === 0) return null;
    
    let pathData = '';
    routeCoordinates.forEach((coord, index) => {
      const { x, y } = getXY(coord, initialLocation);
      if (index === 0) {
        pathData += `M ${x} ${y} `;
      } else {
        pathData += `L ${x} ${y} `;
      }
    });

    return (
      <Path
        d={pathData}
        stroke="#4A90E2"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  };

  const renderMarker = () => {
    const { x, y } = getXY(currentLocation, initialLocation);
    return (
      <G x={x} y={y}>
        <AnimatedCircle
          r={pulseAnim.interpolate({
            inputRange: [1, 2],
            outputRange: [10, 25]
          })}
          fill={markerColor}
          opacity={pulseAnim.interpolate({
            inputRange: [1, 2],
            outputRange: [0.4, 0]
          })}
        />
        <Circle r={8} fill={markerColor} stroke="#FFFFFF" strokeWidth={3} />
      </G>
    );
  };

  const AnimatedGroup = Animated.createAnimatedComponent(G);
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={{ backgroundColor: '#f8f9fa' }}>
          <G x={SCREEN_WIDTH / 2} y={SCREEN_HEIGHT / 2}>
            <AnimatedGroup
              style={{
                transform: [
                  { translateX: mapPanX },
                  { translateY: mapPanY },
                  { scale: zoomLevel },
                ],
              }}
            >
              {renderGrid()}
              {renderRoute()}
              {renderMarker()}
            </AnimatedGroup>
          </G>
        </Svg>
      </View>

      {/* Top Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Speed</Text>
          <Text style={styles.statusValue}>{speed} km/h</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Lat</Text>
          <Text style={styles.statusValue}>{currentLocation.latitude.toFixed(5)}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Lng</Text>
          <Text style={styles.statusValue}>{currentLocation.longitude.toFixed(5)}</Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
          <Text style={styles.controlText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
          <Text style={styles.controlText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButtonIcon} onPress={handleRecenter}>
          <Text style={styles.controlIconText}>◎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
  },
  statusBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  controlText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
    lineHeight: 28,
  },
  controlButtonIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  controlIconText: {
    fontSize: 24,
    color: '#fff',
    lineHeight: 28,
  },
});
