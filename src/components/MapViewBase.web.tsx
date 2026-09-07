import React from 'react';
import { View, Text, Animated } from 'react-native';

export const MapView = (props: any) => (
  <View {...props} style={[{ backgroundColor: '#e0e0e0', alignItems: 'stretch', justifyContent: 'center' }, props.style]}>
    <iframe 
      width="100%" 
      height="100%" 
      style={{ border: 0 }} 
      loading="lazy" 
      allowFullScreen 
      src={`https://www.google.com/maps/embed/v1/place?q=Bangalore,India&key=INSERT_API_KEY_HERE_FOR_WEB_MAPS`} 
    />
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {props.children}
    </View>
  </View>
);

export const Marker = Object.assign(
  (props: any) => <View {...props} />,
  { Animated: (props: any) => <View {...props} /> }
);

export const Polyline = (props: any) => <View {...props} />;
export const PROVIDER_GOOGLE = null;
export type MapTypes = any;
export type Region = any;
export type LatLng = any;

export class AnimatedRegion extends Animated.Value {
  constructor(value: any) {
    super(0);
  }
  setValue(value: any) {}
  setOffset(offset: any) {}
  flattenOffset() {}
  extractOffset() {}
  timing(config: any) {
    return Animated.timing(this, { ...config, toValue: 1 });
  }
  spring(config: any) {
    return Animated.spring(this, { ...config, toValue: 1 });
  }
}

export default MapView;
