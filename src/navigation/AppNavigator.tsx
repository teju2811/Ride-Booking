import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import PickupSelectionScreen from '../screens/PickupSelectionScreen';
import SetPriceScreen from '../screens/SetPriceScreen';
import RideConfirmationScreen from '../screens/RideConfirmationScreen';
import CancelRideScreen from '../screens/CancelRideScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="PickupSelection"
    >
      <Stack.Screen name="PickupSelection" component={PickupSelectionScreen} />
      <Stack.Screen name="SetPrice" component={SetPriceScreen} />
      <Stack.Screen name="RideConfirmation" component={RideConfirmationScreen} />
      <Stack.Screen name="CancelRide" component={CancelRideScreen} />
    </Stack.Navigator>
  );
};
