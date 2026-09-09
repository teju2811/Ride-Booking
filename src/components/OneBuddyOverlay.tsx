import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

interface OneBuddyOverlayProps {
  size?: number;
}

export const OneBuddyOverlay: React.FC<OneBuddyOverlayProps> = ({ size = 110 }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const orbitRadius = size * 0.52;
  const badgeSize = size * 0.32;
  const centerLogoSize = size * 0.52;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={[styles.field, { width: size * 1.4, height: size * 1.4 }]}>
        {/* Subtle Orbit Guide Ring */}
        <View
          style={[
            styles.guideRing,
            {
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              borderRadius: orbitRadius,
            },
          ]}
        />

        {/* Orbiting Layer containing the Cab */}
        <Animated.View
          style={[
            styles.orbitLayer,
            {
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              borderRadius: orbitRadius,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View
            style={[
              styles.slot,
              {
                top: -badgeSize / 2,
                left: orbitRadius - badgeSize / 2,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.cabBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeSize / 2,
                  transform: [{ rotate: counterSpin }],
                },
              ]}
            >
              <Image
                source={require('../../assets/cab_icon.png')}
                style={styles.cabImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Central OneBuddy Logo Plate */}
        <View
          style={[
            styles.centerPlate,
            {
              width: centerLogoSize,
              height: centerLogoSize,
              borderRadius: centerLogoSize / 2,
            },
          ]}
        >
          <Image
            source={require('../../assets/onebuddy_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  field: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  guideRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(143, 212, 26, 0.45)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  orbitLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slot: {
    position: 'absolute',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cabBadge: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 168, 29, 0.6)',
  },
  cabImage: {
    width: '100%',
    height: '100%',
  },
  centerPlate: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(143, 212, 26, 0.3)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
