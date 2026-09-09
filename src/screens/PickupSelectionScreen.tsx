import React from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { MapView, Marker } from '../components/MockMap';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VEHICLES } from '../constants/data';

type Props = NativeStackScreenProps<RootStackParamList, 'PickupSelection'>;

const { height } = Dimensions.get('window');

const PickupSelectionScreen = ({ route, navigation }: Props) => {
  const vehicle = route.params?.vehicle || VEHICLES[3];

  const pickupLocation = {
    id: '1',
    latitude: 17.385044,
    longitude: 78.486671,
    title: 'Kshatriya Foods',
    subtitle: 'Selected pickup',
    description: 'VIP Hills, Jaihind Enclave, Madhapur, Hyderabad',
    fare: vehicle.baseFare,
  };

  const handleConfirmPickup = () => {
    navigation.navigate('SetPrice', { vehicle, pickup: pickupLocation });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }}
            title="Pickup Point"
            pinColor={COLORS.success} // Green pin
          />
        </MapView>
      </View>
      
      <View style={styles.bottomSheetContainer}>
        <View style={styles.dragHandle} />
        
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="map-marker" size={28} color={COLORS.success} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Check your pickup point</Text>
            <Text style={styles.headerSubtitle}>Select a nearby point for easier pickup</Text>
          </View>
        </View>

        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>{pickupLocation.title}</Text>
          <Text style={styles.addressSubtitle} numberOfLines={1}>{pickupLocation.description}</Text>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPickup}>
          <Text style={styles.confirmButtonText}>Confirm pickup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: SIZES.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Light green tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  addressBox: {
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 24,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default PickupSelectionScreen;
