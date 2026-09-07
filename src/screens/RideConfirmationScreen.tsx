import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { MapView, Marker } from '../components/MockMap';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import FareBoostChips from '../components/FareBoostChips';

type Props = NativeStackScreenProps<RootStackParamList, 'RideConfirmation'>;
const { height } = Dimensions.get('window');

const RideConfirmationScreen = ({ route, navigation }: Props) => {
  const { vehicle, pickup } = route.params;
  const [boostAmount, setBoostAmount] = useState(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Driver assignment state: 0 = Searching, 1 = Found, 2 = Assigned
  const [assignmentState, setAssignmentState] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Progress bar animation for "Searching"
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 2. Transition to "Driver Found"
    const timer1 = setTimeout(() => {
      setAssignmentState(1);
      
      // Reset and run a quick pulse for "Found"
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }, 3000);

    // 3. Transition to "Driver Assigned"
    const timer2 = setTimeout(() => {
      setAssignmentState(2);
      // Optional: fade out progress bar or do a success pop
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [progressAnim]);

  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const totalFare = pickup.fare + boostAmount;

  const handleTripDetails = () => {
    bottomSheetRef.current?.expand();
  };

  const handleCancelRide = () => {
    bottomSheetRef.current?.close();
    navigation.navigate('CancelRide', {
      rideDetails: {
        vehicle,
        pickup,
        destination: '123 Main St, City Center', // Dummy dest
        distance: '5.2 km',
        time: '18 min',
        totalFare
      }
    });
  };

  const initialRegion = {
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
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
      </View>
      
      {/* Top Status Notification Card */}
      <View style={styles.topStatusCard}>
        <View style={styles.statusHeaderRow}>
          <View style={styles.statusIconCircle}>
            <Ionicons 
              name={assignmentState === 2 ? 'checkmark-circle' : 'search'} 
              size={20} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {assignmentState === 0 && 'Ride Booked Successfully'}
              {assignmentState === 1 && 'Driver Found!'}
              {assignmentState === 2 && 'Driver Assigned Successfully'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {assignmentState === 0 && 'Searching for nearby drivers...'}
              {assignmentState === 1 && 'Confirming details...'}
              {assignmentState === 2 && 'Your driver is on the way.'}
            </Text>
          </View>
        </View>

        {/* Animated Progress Bar */}
        {assignmentState < 2 && (
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
          </View>
        )}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.fareRow}>
          <View>
            <Text style={styles.totalFareLabel}>Total Fare</Text>
            <Text style={styles.totalFareAmount}>₹{totalFare}</Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={handleTripDetails}>
            <Text style={styles.detailsButtonText}>Trip Details</Text>
          </TouchableOpacity>
        </View>
        
        <FareBoostChips 
          boostAmount={boostAmount} 
          onSelectBoost={setBoostAmount} 
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Closed by default
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Trip Details</Text>
          
          <View style={styles.vehicleInfo}>
            <View style={styles.iconContainer}>
              <Image source={vehicle.image} style={styles.vehicleImageSmall} resizeMode="contain" />
            </View>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationValue}>{pickup.title}</Text>
              </View>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationValue}>123 Main St, City Center</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>5.2 km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>18 min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fare</Text>
              <Text style={styles.statValue}>₹{totalFare}</Text>
            </View>
          </View>

          <View style={styles.sheetButtons}>
            <TouchableOpacity 
              style={[styles.sheetButton, styles.backButton]} 
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sheetButton, styles.cancelButton]} 
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
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
  topStatusCard: {
    position: 'absolute',
    top: 50,
    left: SIZES.medium,
    right: SIZES.medium,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.15)', // Light tint of primary
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  bottomSection: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
  },
  totalFareLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  detailsButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomSheetBackground: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetContent: {
    padding: SIZES.large,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.large,
    textAlign: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  vehicleImageSmall: {
    width: 46,
    height: 46,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  locationContainer: {
    marginBottom: SIZES.large,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.medium,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  locationValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondary,
    padding: SIZES.medium,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.large,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sheetButtons: {
    flexDirection: 'column',
    gap: SIZES.small,
    marginTop: SIZES.medium,
  },
  sheetButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: COLORS.secondary,
  },
  backButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)', // Light tint of COLORS.danger
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RideConfirmationScreen;
