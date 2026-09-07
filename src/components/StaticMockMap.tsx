import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Rect, Defs, Pattern, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface StaticMockMapProps {
  height?: number | string;
}

const StaticMockMap: React.FC<StaticMockMapProps> = ({ height = '45%' }) => {
  return (
    <View style={[styles.container, { height }]}>
      {/* SVG Map Background */}
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} 400`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* Subtle grid pattern for base map texture */}
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAECEE" strokeWidth="1" />
          </Pattern>
        </Defs>

        {/* Base Map Color */}
        <Rect width="100%" height="100%" fill="#F2F4F5" />
        <Rect width="100%" height="100%" fill="url(#grid)" />

        {/* Roads - Minor */}
        <G stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <Path d={`M -50 150 L ${width + 50} 120`} />
          <Path d={`M -50 250 L ${width + 50} 280`} />
          <Path d={`M 100 -50 L 150 450`} />
          <Path d={`M ${width - 100} -50 L ${width - 150} 450`} />
        </G>

        {/* Roads - Major Arterial */}
        <G stroke="#E6E9EB" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
          <Path d={`M -50 80 Q ${width / 2} 180 ${width + 50} 50`} />
          <Path d={`M ${width / 2 - 50} -50 Q ${width / 2} 200 ${width / 2 + 80} 450`} />
        </G>
        {/* Inner lane for Major Arterial */}
        <G stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <Path d={`M -50 80 Q ${width / 2} 180 ${width + 50} 50`} />
          <Path d={`M ${width / 2 - 50} -50 Q ${width / 2} 200 ${width / 2 + 80} 450`} />
        </G>

        {/* Route Line */}
        <Path 
          d={`M 120 180 Q ${width / 2 + 20} 190 ${width - 100} 250`} 
          fill="none" 
          stroke={COLORS.primary || '#007AFF'} 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeDasharray="10, 8"
        />

        {/* Pickup Pin (Green) */}
        <G x="120" y="180">
          <Circle cx="0" cy="0" r="14" fill="rgba(46, 204, 113, 0.2)" />
          <Circle cx="0" cy="0" r="8" fill="#2ECC71" stroke="#FFFFFF" strokeWidth="2" />
          <Rect x="-1" y="8" width="2" height="12" fill="#333333" />
          <Circle cx="0" cy="20" r="3" fill="#333333" opacity="0.3" />
        </G>

        {/* Drop Pin (Red) */}
        <G x={width - 100} y="250">
          <Circle cx="0" cy="0" r="14" fill="rgba(231, 76, 60, 0.2)" />
          <Circle cx="0" cy="0" r="8" fill="#E74C3C" stroke="#FFFFFF" strokeWidth="2" />
          <Rect x="-1" y="8" width="2" height="12" fill="#333333" />
          <Circle cx="0" cy="20" r="3" fill="#333333" opacity="0.3" />
        </G>
        
        {/* Decorative surrounding cars/elements could go here */}
        <G x={width / 2 - 20} y="130" rotation="15">
           <Rect width="14" height="24" rx="4" fill="#34495E" />
           <Rect x="2" y="4" width="10" height="6" rx="1" fill="#7F8C8D" />
           <Rect x="2" y="14" width="10" height="6" rx="1" fill="#7F8C8D" />
        </G>
      </Svg>

      {/* Floating Map Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="add" size={22} color="#333" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="remove" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="locate" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F2F4F5',
    overflow: 'hidden',
    position: 'relative',
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24, // Keep it just above the bottom sheet
    alignItems: 'center',
  },
  zoomControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    width: '100%',
  },
  locationButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
});

export default StaticMockMap;
