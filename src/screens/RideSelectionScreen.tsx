import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import StaticMockMap from '../components/StaticMockMap';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList, Vehicle } from '../types';
import { VEHICLES } from '../constants/data';
import { COLORS, SIZES } from '../constants/theme';
import VehicleCard from '../components/VehicleCard';

type Props = NativeStackScreenProps<RootStackParamList, 'RideSelection'>;

const { height } = Dimensions.get('window');

const RideSelectionScreen = ({ navigation }: Props) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(VEHICLES[3]); // Default select standard Auto

  const handleBookVehicle = () => {
    navigation.navigate('PickupSelection', { vehicle: selectedVehicle });
  };

  return (
    <View style={styles.container}>
      <StaticMockMap height="45%" />
      
      <View style={styles.bottomSheetContainer}>
        <View style={styles.dragHandle} />
        <FlatList
          data={VEHICLES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard 
              vehicle={item} 
              isSelected={selectedVehicle.id === item.id}
              onPress={setSelectedVehicle} 
            />
          )}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={styles.footer}>
          <View style={styles.footerTopRow}>
            <TouchableOpacity 
              style={styles.footerRowItem} 
              onPress={() => Alert.alert('Payment Method', 'Cash payment selected.')}
            >
              <Ionicons name="cash-outline" size={20} color={COLORS.text} />
              <Text style={styles.footerRowText}>Cash</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity 
              style={styles.footerRowItem}
              onPress={() => Alert.alert('Offers', 'No new offers available right now.')}
            >
              <MaterialCommunityIcons name="brightness-percent" size={20} color={COLORS.text} />
              <Text style={styles.footerRowText}>Offers</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.footerBottomRow}>
            <TouchableOpacity style={styles.scheduleButton}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <View style={styles.clockIcon}>
                <Ionicons name="time" size={10} color={COLORS.background} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bookButton} onPress={handleBookVehicle}>
              <Text 
                style={styles.bookButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Book {selectedVehicle.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '40%',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '300',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55, // Fixed height for bottom section
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
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
    marginBottom: 10,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  footer: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SIZES.medium,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  footerRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  footerRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 8,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clockIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text on green background
  },
});

export default RideSelectionScreen;
