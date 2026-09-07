import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export const PROVIDER_DEFAULT = null;

const MAP_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = Dimensions.get('window').height;

// Map boundary bounds (dummy values to map coordinate range to 0-100%)
const LAT_MIN = 17.37;
const LAT_MAX = 17.40;
const LNG_MIN = 78.47;
const LNG_MAX = 78.50;

const getPercent = (val: number, min: number, max: number) => {
  const percent = ((val - min) / (max - min)) * 100;
  return Math.min(Math.max(percent, 5), 95); // keep within 5-95%
};

// Coordinate mapping function
const coordinateToPosition = (latitude: number, longitude: number) => {
  return {
    // Top is inversely related to latitude (higher lat = smaller top)
    top: `${100 - getPercent(latitude, LAT_MIN, LAT_MAX)}%`,
    left: `${getPercent(longitude, LNG_MIN, LNG_MAX)}%`,
  };
};

export const Marker = ({ coordinate, pinColor, title, isDestination = false }: any) => {
  if (!coordinate) return null;
  const position = coordinateToPosition(coordinate.latitude, coordinate.longitude);
  
  return (
    <View style={[styles.markerContainer, { top: position.top, left: position.left }]}>
      {isDestination ? (
        <View style={styles.destinationMarker}>
          <View style={styles.destinationDot} />
        </View>
      ) : (
        <View style={styles.pinMarker}>
          <Ionicons name="location" size={28} color={pinColor || COLORS.success} />
          {title && (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>{title}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export const MapView = ({ style, children, showRoute = false, pickupCoord, destCoord }: any) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  // Render a mock route line
  const renderRoute = () => {
    if (!showRoute || !pickupCoord || !destCoord) return null;

    const p1 = coordinateToPosition(pickupCoord.latitude, pickupCoord.longitude);
    const p2 = coordinateToPosition(destCoord.latitude, destCoord.longitude);

    // Convert percentages to roughly absolute values for line drawing
    // (This is a simplified mock line, it won't be perfect but looks like a route)
    return (
      <View style={styles.routeContainer}>
        {/* Simple SVG-less dashed line using border */}
        <View style={[
          styles.dashedLine, 
          { 
             top: p1.top, 
             left: p1.left, 
             width: '40%', // Mock fixed width
             transform: [{ rotate: '45deg' }] 
          }
        ]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.mapInner, { transform: [{ scale: zoom }] }]}>
        <Image 
          source={require('../../assets/mock_map.jpg')} 
          style={styles.mapImage}
          resizeMode="cover"
        />
        {renderRoute()}
        {children}
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Ionicons name="add" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Ionicons name="remove" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
  },
  mapInner: {
    width: '100%',
    height: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: '40%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  markerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 0,
    height: 0,
  },
  pinMarker: {
    alignItems: 'center',
    bottom: 28, // Lift up so point is at coordinate
    left: -14,
  },
  destinationMarker: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(39, 110, 241, 0.2)', // Light blue halo
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 8,
    left: -8,
  },
  destinationDot: {
    width: 8,
    height: 8,
    backgroundColor: '#276EF1',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  callout: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: -4,
  },
  calloutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  dashedLine: {
    position: 'absolute',
    height: 4,
    borderBottomWidth: 4,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    transformOrigin: '0% 0%', // Pivot from start
  }
});
