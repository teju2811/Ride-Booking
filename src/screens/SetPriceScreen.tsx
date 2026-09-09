import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { MapView, Marker } from '../components/MockMap';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

type Props = NativeStackScreenProps<RootStackParamList, 'SetPrice'>;

const STEPS = [-10, 0, 30, 40, 50, 60, 70];

const SetPriceScreen = ({ route, navigation }: Props) => {
  const { vehicle, pickup } = route.params;
  const [stepIndex, setStepIndex] = useState(1); // Default to 0 offset (diamond)

  const currentPrice = vehicle.baseFare + STEPS[stepIndex];

  const handleBook = () => {
    navigation.navigate('RideConfirmation', { vehicle, pickup, price: currentPrice });
  };

  const dummyDest = {
    latitude: 17.392,
    longitude: 78.495,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showRoute={true}
          pickupCoord={pickup}
          destCoord={dummyDest}
        >
          <Marker
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            pinColor={COLORS.success}
            title="Pickup"
          />
          <Marker
            coordinate={dummyDest}
            isDestination={true}
          />
        </MapView>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <BottomSheet
        snapPoints={['65%']}
        handleIndicatorStyle={{ display: 'none' }}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.title}>Now you can set a price that works for you</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>₹{currentPrice}</Text>
          </View>
          
          <View style={styles.hintContainer}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.textLight} style={styles.hintIcon} />
            <Text style={styles.hintText}>Higher the price, higher the chance of getting a ride</Text>
          </View>

          {/* Custom Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrackBg} />
            <View style={[styles.sliderTrackFill, { width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }]} />
            
            <View style={styles.sliderNodes}>
              {STEPS.map((step, idx) => {
                const isSelected = idx === stepIndex;
                const isDiamond = step === 0;
                return (
                  <View key={idx} style={styles.nodeWrapper}>
                    <Text style={[styles.nodeLabel, idx <= stepIndex ? styles.nodeLabelActive : null]}>
                      {isDiamond ? '' : step > 0 ? `+${step}` : step}
                    </Text>
                    <TouchableOpacity
                      style={styles.touchableNode}
                      onPress={() => setStepIndex(idx)}
                    >
                      {isSelected ? (
                        <View style={styles.thumb} />
                      ) : (
                        <View style={[
                          isDiamond ? styles.nodeDiamond : styles.nodeDot,
                          idx <= stepIndex ? styles.nodeActive : null
                        ]} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
            <Text style={styles.bookButtonText}>Book {vehicle.name} for ₹{currentPrice}</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SIZES.medium,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheetBackground: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetContent: {
    padding: SIZES.large,
    paddingBottom: 80,
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.large,
    lineHeight: 28,
  },
  priceContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 16,
    marginBottom: SIZES.medium,
  },
  priceText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#222B45',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: SIZES.medium,
  },
  hintIcon: {
    marginRight: 8,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    height: 60,
    marginBottom: 20,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    top: 26,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    backgroundColor: COLORS.success,
    borderRadius: 4,
    top: 26,
  },
  sliderNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 40,
  },
  nodeLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: '500',
    height: 18,
  },
  nodeLabelActive: {
    color: COLORS.success,
  },
  touchableNode: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D9D9D9',
  },
  nodeDiamond: {
    width: 10,
    height: 10,
    backgroundColor: '#5C6370',
    transform: [{ rotate: '45deg' }],
  },
  nodeActive: {
    backgroundColor: COLORS.success,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: COLORS.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default SetPriceScreen;
