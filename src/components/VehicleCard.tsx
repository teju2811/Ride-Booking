import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../types';
import { COLORS, SIZES } from '../constants/theme';

interface Props {
  vehicle: Vehicle;
  isSelected: boolean;
  onPress: (vehicle: Vehicle) => void;
}

const VehicleCard = ({ vehicle, isSelected, onPress }: Props) => {
  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]} 
      onPress={() => onPress(vehicle)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContainer}>
        <View style={styles.imageContainer}>
          <Image source={vehicle.image} style={styles.vehicleImage} resizeMode="contain" />
          {vehicle.badge === 'Quickest' && (
            <View style={styles.lightningBadge}>
              <Ionicons name="flash" size={10} color={COLORS.accent} />
            </View>
          )}
          {vehicle.badge === 'Cheaper' && (
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{vehicle.name}</Text>
            {vehicle.badge && (
              <View style={[
                styles.badge, 
                vehicle.badge === 'Quickest' ? styles.badgeQuickest : styles.badgeCheaper
              ]}>
                <Text style={styles.badgeText}>{vehicle.badge}</Text>
              </View>
            )}
          </View>
          
          {vehicle.subtitle && (
            <Text style={styles.subtitle}>{vehicle.subtitle}</Text>
          )}
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailsText}>
              {vehicle.eta} <Text style={styles.dot}>•</Text> {vehicle.dropBy}
            </Text>
            {vehicle.capacity && (
              <>
                <Text style={styles.dot}> • </Text>
                <Ionicons name="person" size={12} color={COLORS.textLight} />
                <Text style={styles.capacityText}> {vehicle.capacity}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.rightContainer}>
        <Text style={styles.fare}>₹{vehicle.baseFare}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.small,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  vehicleImage: {
    width: 60,
    height: 60,
  },
  lightningBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentBadgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCheaper: {
    backgroundColor: '#FFF3E0',
  },
  badgeQuickest: {
    backgroundColor: '#FFF8E1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E65100', // Dark orange/brown text for badges
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  dot: {
    color: '#D1D1D1',
    fontWeight: 'bold',
  },
  capacityText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  rightContainer: {
    justifyContent: 'center',
  },
  fare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default VehicleCard;
