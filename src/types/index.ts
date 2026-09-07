export interface Vehicle {
  id: string;
  name: string;
  type: string;
  image: any; // Can be string or require() ImageSourcePropType
  eta: string;
  dropBy: string;
  baseFare: number;
  subtitle?: string;
  badge?: string;
  capacity?: number;
}

export interface PickupLocation {
  id: string;
  title: string;
  subtitle: string;
  distance?: string;
  fare: number;
  latitude: number;
  longitude: number;
  isCurrent?: boolean;
}

export interface RideDetails {
  vehicle: Vehicle;
  pickup: PickupLocation;
  destination: string;
  distance: string;
  time: string;
  totalFare: number;
}

export type RootStackParamList = {
  RideSelection: undefined;
  PickupSelection: { vehicle: Vehicle };
  RideConfirmation: { vehicle: Vehicle; pickup: PickupLocation; boostAmount?: number };
  CancelRide: { rideDetails: RideDetails };
};
