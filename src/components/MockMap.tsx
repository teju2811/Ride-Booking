import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { OneBuddyOverlay } from './OneBuddyOverlay';

export const PROVIDER_DEFAULT = null;

const MAP_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = Dimensions.get('window').height;

// Map boundary bounds (dummy values to map coordinate range to 0-100%)
const LAT_MIN = 17.32;
const LAT_MAX = 17.40;
const LNG_MIN = 78.46;
const LNG_MAX = 78.52;

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
    <View style={[styles.markerContainer, { top: position.top as any, left: position.left as any }]}>
      {isDestination ? (
        <View style={styles.destinationMarkerGoogle}>
          <Ionicons name="home" size={14} color="#FFF" style={styles.destinationIcon} />
        </View>
      ) : (
        <View style={styles.pinMarker}>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>ETA : 12 MINS</Text>
          </View>
          <View style={styles.vehicleMarker}>
            <Image 
              source={require('../../assets/vehicles/auto.jpg')} 
              style={{ width: 22, height: 22, borderRadius: 3 }} 
              resizeMode="cover" 
            />
          </View>
        </View>
      )}
    </View>
  );
};

interface MapLandmark {
  id: string;
  name: string;
  top: string;
  left: string;
  type?: 'transit' | 'mall' | 'tech' | 'landmark' | 'area';
  icon?: any;
  color?: string;
}

const DEFAULT_LANDMARKS: MapLandmark[] = [
  { id: '1', name: 'Cyber Towers', top: '22%', left: '16%', type: 'tech', icon: 'business-outline', color: '#4F46E5' },
  { id: '2', name: 'Madhapur Metro', top: '16%', left: '66%', type: 'transit', icon: 'train-outline', color: '#0284C7' },
  { id: '3', name: 'Mindspace IT Park', top: '34%', left: '68%', type: 'tech', icon: 'business-outline', color: '#6366F1' },
  { id: '4', name: 'Inorbit Mall', top: '70%', left: '16%', type: 'mall', icon: 'cart-outline', color: '#EA580C' },
  { id: '5', name: 'Durgam Cheruvu', top: '56%', left: '72%', type: 'landmark', icon: 'water-outline', color: '#0D9488' },
  { id: '6', name: 'Kavuri Hills', top: '80%', left: '46%', type: 'area', icon: 'location-outline', color: '#64748B' },
  { id: '7', name: 'Ayyappa Society', top: '30%', left: '40%', type: 'area', icon: 'location-outline', color: '#64748B' },
  { id: '8', name: 'IKEA Hyderabad', top: '82%', left: '74%', type: 'mall', icon: 'storefront-outline', color: '#2563EB' },
];

export { OneBuddyOverlay };

export const MapView = ({ 
  style, 
  children, 
  showRoute = false, 
  pickupCoord, 
  destCoord, 
  showsUserLocation = false, 
  showLandmarks = true,
  showOneBuddyOverlay = true,
  initialRegion, 
  onRegionChange 
}: any) => {
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 2.5;
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.2).toFixed(1)), MAX_ZOOM));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.2).toFixed(1)), MIN_ZOOM));

  // Render a mock route line
  const renderRoute = () => {
    if (!showRoute || !pickupCoord || !destCoord) return null;

    const p1 = coordinateToPosition(pickupCoord.latitude, pickupCoord.longitude);
    const p2 = coordinateToPosition(destCoord.latitude, destCoord.longitude);

    const x1 = parseFloat(p1.left);
    const y1 = parseFloat(p1.top);
    const x2 = parseFloat(p2.left);
    const y2 = parseFloat(p2.top);

    // Create an orthogonal route: Down, then Across, then Up
    const midY = y1 + 15; // Go down 15%

    return (
      <View style={styles.routeContainer}>
        {/* Seg 1: Down from pickup */}
        <View style={[styles.routeSegment, { top: `${y1}%`, left: `${x1}%`, width: 6, height: `${midY - y1}%` }]} />
        {/* Seg 2: Across */}
        <View style={[styles.routeSegment, { top: `${midY}%`, left: `${Math.min(x1, x2)}%`, height: 6, width: `${Math.abs(x2 - x1) + 6}%` }]} />
        {/* Seg 3: Up to destination */}
        <View style={[styles.routeSegment, { top: `${y2}%`, left: `${x2}%`, width: 6, height: `${midY - y2}%` }]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.mapInner, { transform: [{ scale: zoom }] }]}>
        <Image 
          source={require('../../assets/map_2d.jpg')} 
          style={styles.mapImage}
          resizeMode="cover"
        />
        {renderRoute()}

        {/* Surrounding Places / Landmark Badges */}
        {showLandmarks && DEFAULT_LANDMARKS.map((landmark) => (
          <View
            key={landmark.id}
            style={[
              styles.landmarkContainer,
              { top: landmark.top as any, left: landmark.left as any }
            ]}
          >
            {landmark.type !== 'area' ? (
              <View style={styles.landmarkBadge}>
                <Ionicons name={landmark.icon || 'location'} size={11} color={landmark.color || '#475569'} style={{ marginRight: 3 }} />
                <Text style={styles.landmarkText} numberOfLines={1}>{landmark.name}</Text>
              </View>
            ) : (
              <View style={styles.areaBadge}>
                <Text style={styles.areaText}>{landmark.name}</Text>
              </View>
            )}
          </View>
        ))}

        {showsUserLocation && (
          <View style={styles.userLocationContainer}>
            <View style={styles.userLocationPulse} />
            <View style={styles.userLocationDot} />
            <View style={styles.userLocationTag}>
              <Text style={styles.userLocationTagText}>You are here</Text>
            </View>
          </View>
        )}
        {children}
      </View>

      {/* OneBuddy Logo and Cab Animation Center Map Overlay */}
      {showOneBuddyOverlay && <OneBuddyOverlay />}

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomButton, zoom >= MAX_ZOOM && styles.zoomButtonDisabled]}
          onPress={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          accessibilityLabel="Zoom In"
        >
          <Ionicons name="add" size={24} color={zoom >= MAX_ZOOM ? '#CBD5E1' : COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={[styles.zoomButton, zoom <= MIN_ZOOM && styles.zoomButtonDisabled]}
          onPress={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          accessibilityLabel="Zoom Out"
        >
          <Ionicons name="remove" size={24} color={zoom <= MIN_ZOOM ? '#CBD5E1' : COLORS.textLight} />
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
  zoomButtonDisabled: {
    opacity: 0.4,
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
  destinationMarkerGoogle: {
    width: 32,
    height: 32,
    backgroundColor: '#31374A', // Dark blue matching image
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 2, // point of the tear-drop
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    bottom: 16,
    left: -16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
  destinationIcon: {
    transform: [{ rotate: '45deg' }]
  },
  vehicleMarker: {
    width: 26,
    height: 26,
    backgroundColor: '#E8453C', // Red vehicle bg
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    zIndex: 2,
  },
  etaBadge: {
    backgroundColor: '#31374A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    position: 'absolute',
    left: 32,
    top: -2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1,
  },
  etaText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  routeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  routeSegment: {
    position: 'absolute',
    backgroundColor: '#4A89F3', // Google Maps blue
  },
  userLocationContainer: {
    position: 'absolute',
    top: '47%',
    left: '47%',
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
  },
  userLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#4285F4',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  userLocationTag: {
    position: 'absolute',
    top: -24,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  userLocationTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  landmarkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  landmarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  landmarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  areaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  areaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
