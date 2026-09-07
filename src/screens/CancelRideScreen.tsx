import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { CANCEL_REASONS } from '../constants/data';

type Props = NativeStackScreenProps<RootStackParamList, 'CancelRide'>;

const CancelRideScreen = ({ navigation }: Props) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    // Add small delay for visual feedback before showing confirmation
    setTimeout(() => {
      setShowConfirmation(true);
    }, 200);
  };

  const handleCancelRide = () => {
    // Show success notification/toast (using Alert for simplicity)
    Alert.alert('Success', 'Your ride has been cancelled successfully.', [
      { text: 'OK', onPress: () => navigation.navigate('RideSelection') }
    ]);
  };

  const handleKeepSearching = () => {
    navigation.goBack();
  };

  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowConfirmation(false)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.confirmationContent}>
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning-outline" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.confirmationTitle}>
            Are you sure you want to cancel this ride?
          </Text>
          <Text style={styles.confirmationSubtitle}>
            Your driver is already on the way.
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelBtn]} 
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelBtnText}>Cancel My Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.keepSearchingBtn]} 
              onPress={handleKeepSearching}
            >
              <Text style={styles.keepSearchingBtnText}>Keep Searching</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>Why are you cancelling?</Text>
      
      <ScrollView contentContainerStyle={styles.reasonsContainer}>
        {CANCEL_REASONS.map((reason, index) => (
          <TouchableOpacity
            key={index}
            style={styles.reasonRow}
            onPress={() => handleReasonSelect(reason)}
          >
            <Text style={styles.reasonText}>{reason}</Text>
            <View style={styles.radioButton}>
              {selectedReason === reason && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: SIZES.medium,
    marginBottom: SIZES.large,
  },
  reasonsContainer: {
    paddingHorizontal: SIZES.medium,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reasonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  confirmationContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.large,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 42, 42, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.xxlarge,
  },
  actionButtons: {
    width: '100%',
    gap: SIZES.medium,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 42, 42, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  keepSearchingBtn: {
    backgroundColor: COLORS.primary,
  },
  keepSearchingBtnText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CancelRideScreen;
