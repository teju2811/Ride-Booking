import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    FlatList,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    PanResponder,
} from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker } from './MockMap';
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface DestinationItem {
    id: string;
    title: string;
    subtitle: string;
    favorite: boolean;
}

const INITIAL_DESTINATIONS: DestinationItem[] = [
    { id: '1', title: 'Airport', subtitle: 'Rajiv Gandhi International', favorite: false },
    { id: '2', title: 'Railway Station', subtitle: 'Secunderabad', favorite: true }
];

const INITIAL_SAVED_PLACES = [
    { id: 'h1', address: 'Home, Kukatpally', label: 'Home', icon: 'home' },
    { id: 'w1', address: 'Work, HITEC City', label: 'Work', icon: 'briefcase' }
];

const DEFAULT_REGION: Region = {
    latitude: 17.4483,
    longitude: 78.3915,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};

type VehicleKind = 'bike' | 'scooter' | 'xl4' | 'xl7';

function VehicleThumbnail({ kind }: { kind: VehicleKind }) {
    const details = {
        bike: { icon: 'bicycle-outline' as const, color: '#047857', background: '#ccfbf1', label: 'BIKE' },
        scooter: { icon: 'bicycle' as const, color: '#c2410c', background: '#ffedd5', label: 'SCOOTER' },
        xl4: { icon: 'car-sport-outline' as const, color: '#2563eb', background: '#dbeafe', label: 'CAR' },
        xl7: { icon: 'car-outline' as const, color: '#7c3aed', background: '#ede9fe', label: 'XL 7' },
    }[kind];

    return (
        <View style={[styles.vehicleImage, { backgroundColor: details.background }]}>
            <Ionicons name={details.icon} size={32} color={details.color} />
            <Text style={[styles.vehicleImageLabel, { color: details.color }]}>{details.label}</Text>
        </View>
    );
}

export default function RideScreen() {
    const searchInputRef = useRef<TextInput | null>(null);
    const watchSubscription = useRef<Location.LocationSubscription | null>(null);

    const [region, setRegion] = useState<Region | null>(null);
    const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
    const [pickupAddress, setPickupAddress] = useState<string>('Finding your location…');
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [destinations, setDestinations] = useState<DestinationItem[]>(INITIAL_DESTINATIONS);
    const [selectedDestination, setSelectedDestination] = useState<DestinationItem | null>(null);
    const [showRideOptions, setShowRideOptions] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleKind>('xl4');
    const [stops, setStops] = useState<string[]>([]);
    const [addingStop, setAddingStop] = useState(false);
    const [stopQuery, setStopQuery] = useState('');
    const [rideFor, setRideFor] = useState('For me');
    const [showRideForMenu, setShowRideForMenu] = useState(false);
    const [showPickupEditor, setShowPickupEditor] = useState(false);
    const [pickupInput, setPickupInput] = useState('');
    const [showSavedAddresses, setShowSavedAddresses] = useState(false);
    const [showRideDetails, setShowRideDetails] = useState(false);
    const [rideType, setRideType] = useState<'normal' | 'schedule' | 'smart'>('normal');
    const [scheduledTime, setScheduledTime] = useState('Today, 6:00 PM');
    const [customSchedule, setCustomSchedule] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [mapZoom, setMapZoom] = useState(1);
    const mapZoomRef = useRef(1);
    const mapZoomStart = useRef(1);

    const backSwipeResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                searchMode && gestureState.dx > 12 && Math.abs(gestureState.dy) < 30,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 80) setSearchMode(false);
            },
        })
    ).current;

    const mapZoomResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches >= 2,
            onPanResponderGrant: () => {
                mapZoomStart.current = mapZoomRef.current;
            },
            onPanResponderMove: (_, gestureState) => {
                const pinchChange = Math.max(-1, Math.min(1, gestureState.dy / 120));
                setMapZoom(Math.max(1, Math.min(3, mapZoomStart.current - pinchChange)));
            },
        })
    ).current;

    useEffect(() => {
        mapZoomRef.current = mapZoom;
    }, [mapZoom]);

    useEffect(() => {
        let isMounted = true;

        const startLocationTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (isMounted) {
                        setLocationError('Location permission denied');
                        setRegion(DEFAULT_REGION);
                        setLocationLoading(false);
                    }
                    Alert.alert(
                        'Location permission needed',
                        'Please enable location access so we can find your pickup point.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        ]
                    );
                    return;
                }

                const initialPosition = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                if (!isMounted) return;

                const coords: Coordinates = {
                    latitude: initialPosition.coords.latitude,
                    longitude: initialPosition.coords.longitude,
                };

                setPickupCoords(coords);
                setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
                setLocationLoading(false);
                reverseGeocode(coords);

                watchSubscription.current = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
                    (position) => {
                        if (!isMounted) return;
                        setPickupCoords({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    }
                );
            } catch (err) {
                console.warn('Location error:', err);
                if (isMounted) {
                    setLocationError('Could not fetch location');
                    setRegion(DEFAULT_REGION);
                    setLocationLoading(false);
                }
            }
        };

        startLocationTracking();

        return () => {
            isMounted = false;
            watchSubscription.current?.remove();
        };
    }, []);

    const reverseGeocode = useCallback(async (coords: Coordinates) => {
        try {
            const results = await Location.reverseGeocodeAsync(coords);
            if (results.length > 0) {
                const place = results[0];
                const parts = [place.name, place.street, place.district, place.city].filter(Boolean);
                setPickupAddress(parts.join(', ') || 'Current location');
            } else {
                setPickupAddress('Current location');
            }
        } catch (err) {
            console.warn('Reverse geocode error:', err);
            setPickupAddress('Current location');
        }
    }, []);

    const handleRecenter = useCallback(() => {
        setLocationError(null);
        setMapZoom(2);
    }, []);

    const zoomIn = useCallback(() => {
        setMapZoom((currentZoom) => Math.min(3, Number((currentZoom + 0.5).toFixed(1))));
    }, []);

    const zoomOut = useCallback(() => {
        setMapZoom((currentZoom) => Math.max(1, Number((currentZoom - 0.5).toFixed(1))));
    }, []);

    useEffect(() => {
        if (searchMode) {
            const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [searchMode]);

    useEffect(() => {
        if (!searchMode) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (showRideForMenu) {
                setShowRideForMenu(false);
                return true;
            }
            setSearchMode(false);
            return true;
        });
        return () => subscription.remove();
    }, [searchMode, showRideForMenu]);

    const openSearch = useCallback(() => {
        setSearchMode(true);
    }, []);

    const toggleFavorite = useCallback((id: string) => {
        setDestinations((prev) =>
            prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
        );
    }, []);

    const handleSelectDestination = useCallback((item: DestinationItem) => {
        setSearchQuery(item.title);
        setSelectedDestination(item);
        setSearchMode(false);
        setShowRideOptions(true);
    }, []);

    const openRideResults = useCallback(() => {
        const query = searchQuery.trim();
        if (!query) return;
        const matchingDestination = destinations.find(
            (item) => item.title.toLowerCase() === query.toLowerCase()
        );
        setSelectedDestination(
            matchingDestination || {
                id: `custom-${Date.now()}`,
                title: query,
                subtitle: 'Selected destination',
                favorite: false,
            }
        );
        setSearchMode(false);
        setShowRideOptions(true);
    }, [destinations, searchQuery]);

    const canOpenRideResults = searchQuery.trim().length > 0;

    const handleSelectSavedAddress = useCallback((address: string) => {
        setSearchQuery(address);
        setSelectedDestination(null);
        setShowSavedAddresses(false);
        searchInputRef.current?.focus();
    }, []);

    const selectPickup = useCallback((address: string) => {
        setPickupAddress(address);
        setPickupInput(address);
        setShowPickupEditor(false);
    }, []);

    const addStop = useCallback(() => {
        const value = stopQuery.trim();
        if (!value) return;
        setStops((previous) => [...previous, value]);
        setStopQuery('');
        setAddingStop(false);
    }, [stopQuery]);

    const filteredDestinations = destinations.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    });

    if (showRideOptions && selectedDestination) {
        return (
            <View style={styles.resultsScreen}>
                <View style={styles.resultsMap}>
                    <MapView
                        style={StyleSheet.absoluteFill}
                        showRoute={true}
                        pickupCoord={pickupCoords || { latitude: 17.36, longitude: 78.47 }}
                        destCoord={{ latitude: 17.38, longitude: 78.50 }}
                        showsUserLocation={true}
                    >
                        {pickupCoords && (
                            <Marker coordinate={pickupCoords} title="Pickup" />
                        )}
                        <Marker
                            coordinate={{ latitude: 17.38, longitude: 78.50 }}
                            isDestination
                            title={selectedDestination.title}
                        />
                    </MapView>
                    <View style={styles.resultsPickupLabel}><Text style={styles.resultsLabelText} numberOfLines={1}>{pickupAddress}</Text><Ionicons name="create-outline" size={18} color="#64748b" /></View>
                    <View style={styles.resultsDropLabel}><Text style={styles.resultsLabelText} numberOfLines={1}>{selectedDestination.title}</Text><Ionicons name="create-outline" size={18} color="#64748b" /></View>
                    <TouchableOpacity style={styles.resultsBackButton} onPress={() => setShowRideOptions(false)}>
                        <Ionicons name="arrow-back" size={25} color="#0f172a" />
                    </TouchableOpacity>
                    <View style={styles.resultsLocationButton}><Ionicons name="locate" size={24} color="#0f766e" /></View>
                </View>

                <View style={styles.resultsSheet}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.resultsSheetHeader}>
                        <Text style={styles.resultsTitle}>Choose a ride</Text>
                    </View>
                    <Text style={styles.resultsSubtitle}>Pickup in 3 mins · Drop around 5:23 PM</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rideOptionsList}>
                        <TouchableOpacity style={[styles.rideOptionRow, selectedVehicle === 'bike' && styles.rideOptionSelected]} onPress={() => setSelectedVehicle('bike')}>
                            <VehicleThumbnail kind="bike" />
                            <View style={styles.rideOptionCopy}><Text style={styles.rideOptionTitle}>Bike</Text><Text style={styles.rideOptionMeta}>7 mins · Drop 5:22 PM</Text></View>
                            <Text style={styles.rideFare}>₹107</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rideOptionRow, selectedVehicle === 'scooter' && styles.rideOptionSelected]} onPress={() => setSelectedVehicle('scooter')}>
                            <VehicleThumbnail kind="scooter" />
                            <View style={styles.rideOptionCopy}><Text style={styles.rideOptionTitle}>Scooter</Text><Text style={styles.rideOptionMeta}>3 mins · Drop 5:18 PM</Text></View>
                            <Text style={styles.rideFare}>₹108</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rideOptionRow, selectedVehicle === 'xl4' && styles.rideOptionSelected]} onPress={() => setSelectedVehicle('xl4')}>
                            <VehicleThumbnail kind="xl4" />
                            <View style={styles.rideOptionCopy}><Text style={styles.rideOptionTitle}>Car · 4 seater</Text><Text style={styles.rideOptionMeta}>3 mins away · Drop 5:23 PM</Text></View>
                            <Text style={styles.rideFare}>₹178–₹184</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rideOptionRow, selectedVehicle === 'xl7' && styles.rideOptionSelected]} onPress={() => setSelectedVehicle('xl7')}>
                            <VehicleThumbnail kind="xl7" />
                            <View style={styles.rideOptionCopy}><Text style={styles.rideOptionTitle}>XL Car · 7 seater</Text><Text style={styles.rideOptionMeta}>5 mins away · Drop 5:25 PM</Text></View>
                            <Text style={styles.rideFare}>₹248–₹260</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <View style={styles.bookingFooter}>
                        <TouchableOpacity style={styles.bookButton} onPress={() => Alert.alert('Ride booked', `Your ${selectedVehicle === 'bike' ? 'Bike' : selectedVehicle === 'scooter' ? 'Scooter' : 'XL Car'} ride to ${selectedDestination.title} is ready.`)}><Text style={styles.bookButtonText}>Book {selectedVehicle === 'bike' ? 'Bike' : selectedVehicle === 'scooter' ? 'Scooter' : 'XL Car'}</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    if (searchMode) {
        return (
            <View style={styles.searchScreen} {...backSwipeResponder.panHandlers}>
                <View style={styles.searchHeader}>
                    <TouchableOpacity onPress={() => setSearchMode(false)} accessibilityLabel="Go back">
                        <Ionicons name="arrow-back" size={28} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.searchTitle}>Drop</Text>
                    <TouchableOpacity style={styles.forMeButton} onPress={() => setShowRideForMenu(true)}>
                        <Text style={styles.forMeText}>{rideFor}</Text>
                        <Ionicons name="chevron-down" size={22} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {showRideForMenu && (
                    <Modal visible transparent animationType="slide" onRequestClose={() => setShowRideForMenu(false)}>
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Who is this ride for?</Text>
                                    <TouchableOpacity onPress={() => setShowRideForMenu(false)}><Ionicons name="close" size={24} color="#334155" /></TouchableOpacity>
                                </View>
                                {['For me', 'Someone else', 'Business'].map((option) => (
                                    <TouchableOpacity key={option} style={styles.rideForOption} onPress={() => { setRideFor(option); setShowRideForMenu(false); }}>
                                        <Text style={styles.rideForOptionText}>{option}</Text>
                                        {rideFor === option && <Ionicons name="checkmark-circle" size={21} color="#047857" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Modal>
                )}

                <View style={styles.routeCard}>
                    <View style={styles.routeLine} />
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, styles.pickupDot]} />
                        <TouchableOpacity style={styles.pickupButton} onPress={() => { setPickupInput(pickupAddress); setShowPickupEditor(true); }}>
                            <Text style={styles.pickupText} numberOfLines={1}>{pickupAddress || 'Current location'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.routeDivider} />
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, styles.dropDot]} />
                        <TextInput
                            ref={searchInputRef}
                            style={styles.dropInput}
                            placeholder="Drop location"
                            placeholderTextColor="#64748b"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={openRideResults}
                            returnKeyType="search"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.seeRidesButton, !canOpenRideResults && styles.seeRidesButtonDisabled]}
                    onPress={openRideResults}
                    disabled={!canOpenRideResults}
                >
                    <Ionicons name="car-outline" size={22} color="#0f172a" />
                    <Text style={styles.seeRidesButtonText}>See available rides</Text>
                    <Ionicons name="arrow-forward" size={21} color="#0f172a" />
                </TouchableOpacity>

                <Modal visible={showPickupEditor} transparent animationType="slide" onRequestClose={() => setShowPickupEditor(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Choose pickup location</Text>
                                <TouchableOpacity onPress={() => setShowPickupEditor(false)}><Ionicons name="close" size={24} color="#334155" /></TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.pickupChoice} onPress={() => selectPickup(pickupAddress || 'Current location')}>
                                <Ionicons name="locate-outline" size={22} color="#047857" />
                                <Text style={styles.pickupChoiceText}>Use current location</Text>
                            </TouchableOpacity>
                            {INITIAL_SAVED_PLACES.map((place) => (
                                <TouchableOpacity key={place.id} style={styles.pickupChoice} onPress={() => selectPickup(place.address)}>
                                    <Ionicons name={place.icon === 'home' ? 'home-outline' : 'briefcase-outline'} size={22} color="#047857" />
                                    <View style={styles.savedAddressCopy}><Text style={styles.pickupChoiceText}>{place.label}</Text><Text style={styles.savedAddressText}>{place.address}</Text></View>
                                </TouchableOpacity>
                            ))}
                            <TextInput style={styles.customScheduleInput} placeholder="Enter another pickup address" placeholderTextColor="#94a3b8" value={pickupInput} onChangeText={setPickupInput} />
                            <TouchableOpacity style={styles.modalDoneButton} onPress={() => selectPickup(pickupInput.trim() || pickupAddress)}><Text style={styles.modalDoneText}>Use this pickup</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={styles.searchActions}>
                    <TouchableOpacity style={styles.outlineAction} onPress={() => Alert.alert('Select on map', 'Map selection will be available here.')}>
                        <Ionicons name="location-outline" size={27} color="#0f172a" />
                        <Text style={styles.actionText}>Select on map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineAction} onPress={() => setAddingStop(true)}>
                        <Ionicons name="add" size={28} color="#0f172a" />
                        <Text style={styles.actionText}>Add stops</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineAction} onPress={() => setShowSavedAddresses(true)}>
                        <Ionicons name="bookmark-outline" size={25} color="#0f172a" />
                        <Text style={styles.actionText}>Saved addresses</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={showSavedAddresses} transparent animationType="slide" onRequestClose={() => setShowSavedAddresses(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.savedAddressTitle}>Your saved addresses</Text>
                                <TouchableOpacity onPress={() => setShowSavedAddresses(false)}>
                                    <Ionicons name="close" size={24} color="#334155" />
                                </TouchableOpacity>
                            </View>
                            {INITIAL_SAVED_PLACES.map((place) => (
                                <TouchableOpacity key={place.id} style={styles.savedAddressRow} onPress={() => handleSelectSavedAddress(place.address)}>
                                    <Ionicons name={place.icon === 'home' ? 'home-outline' : 'briefcase-outline'} size={21} color="#0f766e" />
                                    <View style={styles.savedAddressCopy}>
                                        <Text style={styles.savedAddressLabel}>{place.label}</Text>
                                        <Text style={styles.savedAddressText} numberOfLines={1}>{place.address}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Modal>

                {stops.map((stop, index) => (
                    <View key={`${stop}-${index}`} style={styles.stopRow}>
                        <Ionicons name="ellipse-outline" size={20} color="#c2410c" />
                        <Text style={styles.stopText} numberOfLines={1}>{stop}</Text>
                        <TouchableOpacity onPress={() => setStops((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}>
                            <Ionicons name="close-circle-outline" size={21} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                ))}

                {addingStop && (
                    <View style={styles.addStopBox}>
                        <TextInput
                            autoFocus
                            style={styles.addStopInput}
                            placeholder="Enter stop location"
                            placeholderTextColor="#94a3b8"
                            value={stopQuery}
                            onChangeText={setStopQuery}
                            onSubmitEditing={addStop}
                            returnKeyType="done"
                        />
                        <TouchableOpacity style={styles.addStopButton} onPress={addStop}>
                            <Text style={styles.addStopButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList
                    data={filteredDestinations}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.searchResults}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={<Text style={styles.emptyText}>No matching places found.</Text>}
                    renderItem={({ item }) => (
                        <Pressable style={styles.searchResultRow} onPress={() => handleSelectDestination(item)}>
                            <Ionicons name="time-outline" size={28} color="#64748b" />
                            <View style={styles.searchResultCopy}>
                                <Text style={styles.searchResultTitle}>{item.title}</Text>
                                <Text style={styles.searchResultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                            </View>
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={12}>
                                <Ionicons name={item.favorite ? 'heart' : 'heart-outline'} size={30} color="#64748b" />
                            </TouchableOpacity>
                        </Pressable>
                    )}
                />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.homePageContent}
            showsVerticalScrollIndicator
            scrollEnabled
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.mapContainer}>
                {locationLoading && (
                    <View style={styles.mapLoadingOverlay}>
                        <ActivityIndicator size="large" color="#047857" />
                        <Text style={styles.mapLoadingText}>Getting your live location…</Text>
                    </View>
                )}

                {locationError && !locationLoading && (
                    <View style={styles.mapErrorBanner}>
                        <Ionicons name="warning-outline" size={20} color="#c0392b" />
                        <Text style={styles.mapLoadingText}>{locationError}</Text>
                        <TouchableOpacity onPress={() => Linking.openSettings()}>
                            <Text style={styles.retryButtonText}>Open Settings</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.mockMap}>
                    <MapView
                        style={StyleSheet.absoluteFill}
                        showsUserLocation={true}
                    >
                        {pickupCoords && (
                            <Marker
                                coordinate={pickupCoords}
                                title="Pickup Location"
                            />
                        )}
                    </MapView>
                </View>

                <TouchableOpacity
                    style={styles.recenterButton}
                    onPress={handleRecenter}
                    disabled={!pickupCoords}
                    accessibilityLabel="Recenter map to my location"
                >
                    <Ionicons name="locate" size={22} color="#047857" />
                </TouchableOpacity>

                <View style={styles.addressPill}>
                    <View style={styles.addressDot} />
                    <Text style={styles.addressText} numberOfLines={1}>
                        {pickupAddress}
                    </Text>
                </View>
            </View>

            <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                {/* ONEBUDDY Logo Header */}
                <View style={styles.pageHeader}>
                    <Image
                        source={require('../assets/onebuddy_logo.png')}
                        style={styles.pageHeaderLogo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
                    <TouchableOpacity style={styles.searchInputButton} onPress={openSearch} activeOpacity={0.8}>
                        <Text style={searchQuery ? styles.searchInputValue : styles.searchInputPlaceholder} numberOfLines={1}>
                            {searchQuery || 'Where do you want to go?'}
                        </Text>
                    </TouchableOpacity>
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>

                {selectedDestination && (
                    <View style={styles.selectedBanner}>
                        <Ionicons name="location" size={16} color="#047857" />
                        <Text style={styles.selectedBannerText} numberOfLines={1}>
                            Going to: {selectedDestination.title}
                        </Text>
                    </View>
                )}

                <View style={styles.rideCategories}>
                    <Text style={styles.sectionLabel}>Choose your ride</Text>
                    <View style={styles.categoryRow}>
                        <TouchableOpacity
                            style={[styles.categoryCard, rideType === 'schedule' && styles.categoryCardActive]}
                            onPress={() => {
                                setRideType('schedule');
                                setShowRideDetails(true);
                            }}
                        >
                            <View style={[styles.categoryIcon, rideType === 'schedule' && styles.categoryIconActive]}>
                                <Ionicons name="calendar-outline" size={22} color={rideType === 'schedule' ? '#fff' : '#0f766e'} />
                            </View>
                            <Text style={styles.categoryTitle}>Schedule ride</Text>
                            <Text style={styles.categorySubtitle}>Book for later</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.categoryCard, rideType === 'smart' && styles.smartCardActive]}
                            onPress={() => {
                                setRideType('smart');
                                setShowRideDetails(true);
                            }}
                        >
                            <View style={[styles.categoryIcon, styles.smartIcon, rideType === 'smart' && styles.smartIconActive]}>
                                <Ionicons name="flash-outline" size={22} color={rideType === 'smart' ? '#fff' : '#b45309'} />
                            </View>
                            <Text style={styles.categoryTitle}>Smart ride</Text>
                            <Text style={styles.categorySubtitle}>Faster pickup</Text>
                        </TouchableOpacity>
                    </View>

                    {rideType === 'schedule' && (
                        <View style={styles.schedulePanel}>
                            <View style={styles.schedulePanelHeader}>
                                <Ionicons name="time-outline" size={20} color="#0f766e" />
                                <Text style={styles.schedulePanelTitle}>When should we pick you up?</Text>
                            </View>
                            <View style={styles.timeOptions}>
                                {['Today, 6:00 PM', 'Tomorrow, 9:00 AM', 'Tomorrow, 6:00 PM'].map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        style={[styles.timeOption, scheduledTime === time && styles.timeOptionActive]}
                                        onPress={() => setScheduledTime(time)}
                                    >
                                        <Text style={[styles.timeOptionText, scheduledTime === time && styles.timeOptionTextActive]}>{time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {rideType === 'smart' && (
                        <View style={styles.smartPanel}>
                            <Ionicons name="flash" size={20} color="#b45309" />
                            <View style={styles.smartPanelCopy}>
                                <Text style={styles.smartPanelTitle}>Priority pickup</Text>
                                <Text style={styles.smartPanelText}>A driver arrives faster. Smart rides cost about 25% more than a normal ride.</Text>
                            </View>
                            <Text style={styles.smartPremium}>+25%</Text>
                        </View>
                    )}
                </View>

                <Modal visible={showRideDetails} transparent animationType="slide" onRequestClose={() => setShowRideDetails(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{rideType === 'schedule' ? 'Schedule your ride' : 'Choose Smart Ride'}</Text>
                                <TouchableOpacity onPress={() => setShowRideDetails(false)}>
                                    <Ionicons name="close" size={24} color="#334155" />
                                </TouchableOpacity>
                            </View>
                            {rideType === 'schedule' ? (
                                <>
                                    <Text style={styles.modalDescription}>Pick a time and your driver will arrive then.</Text>
                                    {['Today, 6:00 PM', 'Tomorrow, 9:00 AM', 'Tomorrow, 6:00 PM'].map((time) => (
                                        <TouchableOpacity key={time} style={[styles.modalChoice, scheduledTime === time && styles.modalChoiceActive]} onPress={() => setScheduledTime(time)}>
                                            <Ionicons name="calendar-outline" size={20} color={scheduledTime === time ? '#0f766e' : '#64748b'} />
                                            <Text style={styles.modalChoiceText}>{time}</Text>
                                            {scheduledTime === time && <Ionicons name="checkmark-circle" size={20} color="#0f766e" />}
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.customizeButton, customSchedule && styles.customizeButtonActive]}
                                        onPress={() => setCustomSchedule((visible) => !visible)}
                                    >
                                        <Ionicons name="options-outline" size={20} color="#0f766e" />
                                        <Text style={styles.customizeButtonText}>Customize date and time</Text>
                                        <Ionicons name={customSchedule ? 'chevron-up' : 'chevron-down'} size={18} color="#0f766e" />
                                    </TouchableOpacity>
                                    {customSchedule && (
                                        <View style={styles.customScheduleBox}>
                                            <TextInput
                                                style={styles.customScheduleInput}
                                                placeholder="Date (e.g. 12 Sep 2026)"
                                                placeholderTextColor="#94a3b8"
                                                value={customDate}
                                                onChangeText={setCustomDate}
                                            />
                                            <TextInput
                                                style={styles.customScheduleInput}
                                                placeholder="Time (e.g. 7:30 PM)"
                                                placeholderTextColor="#94a3b8"
                                                value={customTime}
                                                onChangeText={setCustomTime}
                                            />
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.smartModalBody}>
                                    <Ionicons name="flash" size={30} color="#b45309" />
                                    <Text style={styles.modalDescription}>Smart Ride gets priority pickup and arrives faster than a normal ride.</Text>
                                    <Text style={styles.modalPremium}>Estimated fare: about 25% higher than normal</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.modalDoneButton}
                                onPress={() => {
                                    if (rideType === 'schedule' && customSchedule && customDate.trim() && customTime.trim()) {
                                        setScheduledTime(`${customDate.trim()}, ${customTime.trim()}`);
                                    }
                                    setShowRideDetails(false);
                                }}
                            >
                                <Text style={styles.modalDoneText}>{rideType === 'schedule' ? 'Save schedule' : 'Continue'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={styles.homeContentScroll}>
                    {filteredDestinations.length === 0 && <Text style={styles.emptyText}>No matching places found.</Text>}
                    {filteredDestinations.map((item) => (
                        <Pressable
                            key={item.id}
                            style={({ pressed }) => [styles.destinationRow, pressed && styles.rowPressed]}
                            onPress={() => handleSelectDestination(item)}
                        >
                            <Ionicons name="time-outline" size={20} color="#555" style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.destinationTitle}>{item.title}</Text>
                                <Text style={styles.destinationSubtitle} numberOfLines={1}>
                                    {item.subtitle}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => toggleFavorite(item.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={item.favorite ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={item.favorite ? '#e74c3c' : '#94a3b8'}
                                />
                            </TouchableOpacity>
                        </Pressable>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    resultsScreen: { flex: 1, backgroundColor: '#f8faf5' },
    resultsMap: { height: '43%', minHeight: 300, overflow: 'hidden', backgroundColor: '#dce8df' },
    resultsRouteLine: { position: 'absolute', left: '49%', top: '25%', width: 4, height: '48%', backgroundColor: '#14251c', transform: [{ rotate: '18deg' }] },
    resultsRoadShield: { position: 'absolute', top: '31%', left: '52%', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 5, backgroundColor: '#facc15', borderWidth: 1, borderColor: '#a16207' },
    resultsRoadShieldText: { color: '#334155', fontSize: 13, fontWeight: '900' },
    resultsPickupPin: { position: 'absolute', left: '43%', top: '57%', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(4,120,87,0.25)', justifyContent: 'center', alignItems: 'center' },
    resultsDropPin: { position: 'absolute', left: '57%', top: '18%', width: 34, height: 34, borderRadius: 17, backgroundColor: '#ef4444', borderWidth: 6, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    resultsDropDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
    resultsPickupLabel: { position: 'absolute', left: '16%', top: '53%', maxWidth: '42%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15, backgroundColor: '#fff', elevation: 4 },
    resultsDropLabel: { position: 'absolute', left: '25%', top: '8%', maxWidth: '44%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15, backgroundColor: '#fff', elevation: 4 },
    resultsLabelText: { flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '800' },
    resultsBackButton: { position: 'absolute', left: 18, bottom: 30, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 4 },
    resultsLocationButton: { position: 'absolute', right: 18, bottom: 30, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 4 },
    resultsSheet: { flex: 1, paddingTop: 9, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#fff', marginTop: -18 },
    resultsSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8 },
    resultsTitle: { color: '#0f172a', fontSize: 22, fontWeight: '900' },
    resultsSubtitle: { paddingHorizontal: 18, paddingTop: 4, color: '#64748b', fontSize: 13 },
    rideOptionsList: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
    rideOptionRow: { flexDirection: 'row', alignItems: 'center', minHeight: 76, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4, borderRadius: 16, backgroundColor: '#fff' },
    rideOptionSelected: { borderWidth: 1.5, borderColor: '#1f4e79', backgroundColor: '#fbfef8' },
    vehicleImage: { width: 68, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfccb' },
    vehicleImageLabel: { fontSize: 8, fontWeight: '900', marginTop: -2 },
    rideOptionCopy: { flex: 1, paddingHorizontal: 8 },
    rideOptionTitle: { color: '#334155', fontSize: 18, fontWeight: '800' },
    rideOptionMeta: { color: '#64748b', fontSize: 13, marginTop: 3 },
    rideFare: { color: '#334155', fontSize: 19, fontWeight: '900' },
    bookingFooter: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
    bookButton: { alignItems: 'center', justifyContent: 'center', minHeight: 56, borderRadius: 30, backgroundColor: '#a3e635' },
    bookButtonText: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
    homePageContent: { flexGrow: 1 },
    searchScreen: { flex: 1, backgroundColor: '#fff' },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 26,
        gap: 18,
    },
    searchTitle: { flex: 1, fontSize: 28, fontWeight: '800', color: '#0f172a' },
    forMeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    forMeText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    rideForOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
    rideForOptionText: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
    routeCard: {
        marginHorizontal: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    routeLine: {
        position: 'absolute',
        left: 34,
        top: 42,
        bottom: 42,
        borderLeftWidth: 3,
        borderStyle: 'dashed',
        borderColor: '#64748b',
    },
    routeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 18 },
    routeDot: { width: 18, height: 18, borderRadius: 9, zIndex: 1 },
    pickupDot: { backgroundColor: '#16a05d', borderWidth: 5, borderColor: '#16a05d' },
    dropDot: { backgroundColor: '#c2410c', borderWidth: 5, borderColor: '#fed7aa' },
    pickupButton: { flex: 1, minHeight: 40, justifyContent: 'center' },
    pickupText: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    routeDivider: { height: 1.5, backgroundColor: '#e2e8f0', marginLeft: 38, marginVertical: 4 },
    dropInput: { flex: 1, fontSize: 17, color: '#0f172a', padding: 0 },
    seeRidesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 14, minHeight: 54, borderRadius: 28, backgroundColor: '#a3e635' },
    seeRidesButtonDisabled: { opacity: 0.45 },
    seeRidesButtonText: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
    searchActions: { paddingHorizontal: 16, paddingTop: 22, gap: 14 },
    outlineAction: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 28,
        paddingHorizontal: 22,
        paddingVertical: 12,
    },
    actionText: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.35)' },
    modalCard: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800' },
    modalDescription: { color: '#64748b', fontSize: 14, lineHeight: 20, marginBottom: 12 },
    modalChoice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    modalChoiceActive: { borderColor: '#99f6e4', backgroundColor: '#f0fdfa' },
    modalChoiceText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '700' },
    pickupChoice: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
    pickupChoiceText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '700' },
    customizeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#99f6e4' },
    customizeButtonActive: { backgroundColor: '#f0fdfa' },
    customizeButtonText: { flex: 1, color: '#0f766e', fontSize: 14, fontWeight: '800' },
    customScheduleBox: { gap: 9, marginTop: 9 },
    customScheduleInput: { height: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', color: '#0f172a', fontSize: 14 },
    smartModalBody: { alignItems: 'center', paddingVertical: 8 },
    modalPremium: { color: '#b45309', fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    modalDoneButton: { marginTop: 16, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#0f766e' },
    modalDoneText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    savedAddressTitle: { color: '#115e59', fontSize: 14, fontWeight: '800', marginBottom: 4 },
    savedAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccfbf1' },
    savedAddressCopy: { flex: 1 },
    savedAddressLabel: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
    savedAddressText: { color: '#64748b', fontSize: 12, marginTop: 2 },
    stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#fff7ed' },
    stopText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
    addStopBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingLeft: 12, overflow: 'hidden' },
    addStopInput: { flex: 1, height: 44, color: '#0f172a', fontSize: 15 },
    addStopButton: { height: 44, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#0f172a' },
    addStopButtonText: { color: '#fff', fontWeight: '700' },
    searchResults: { paddingHorizontal: 20, paddingTop: 12 },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#cbd5e1',
    },
    searchResultCopy: { flex: 1 },
    searchResultTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    searchResultSubtitle: { fontSize: 15, color: '#475569', marginTop: 4 },
    homeContentScroll: { marginTop: 8, paddingBottom: 24 },
    mapContainer: { height: 360, backgroundColor: '#e9e9e9' },
    mockMap: { ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#636c65' },
    mockMapCanvas: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
    mapImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
    mockLocationPin: { position: 'absolute', top: '48%', left: '48%', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(71,86,77,0.6)', justifyContent: 'center', alignItems: 'center' },
    mockLocationDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#003322', borderWidth: 3, borderColor: '#5e6a61' },
    zoomControls: {
        position: 'absolute',
        right: 16,
        top: 16,
        overflow: 'hidden',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.85)',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    zoomButton: { width: 44, height: 42, justifyContent: 'center', alignItems: 'center' },
    zoomDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#cbd5e1' },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        zIndex: 5,
    },
    mapLoadingText: { marginTop: 8, color: '#475569', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
    mapErrorBanner: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        zIndex: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#fff7ed',
        elevation: 3,
    },
    retryButtonText: { color: '#fff', fontWeight: '600' },
    recenterButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    addressPill: {
        position: 'absolute',
        left: 16,
        right: 70,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    addressDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#004A33', marginRight: 10 },
    addressText: { fontSize: 14, fontWeight: '700', color: '#1a211c', flexShrink: 1 },
    sheet: {
        flex: 1.1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 10 },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        marginBottom: 8,
    },
    pageHeaderLogo: {
        height: 32,
        width: 160,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 26,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInputButton: { flex: 1, justifyContent: 'center' },
    searchInputPlaceholder: { fontSize: 16, color: '#94a3b8' },
    searchInputValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    selectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#a7f3d0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 10,
    },
    selectedBannerText: { color: '#047857', fontWeight: '600', fontSize: 13, flex: 1 },
    rideCategories: { marginTop: 14, paddingHorizontal: 16 },
    sectionLabel: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginBottom: 9 },
    categoryRow: { flexDirection: 'row', gap: 10 },
    categoryCard: { flex: 1, minHeight: 102, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#dbe4e2', backgroundColor: '#fff' },
    categoryCardActive: { borderColor: '#0f766e', backgroundColor: '#f0fdfa' },
    smartCardActive: { borderColor: '#d97706', backgroundColor: '#fffbeb' },
    categoryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', marginBottom: 8 },
    categoryIconActive: { backgroundColor: '#0f766e' },
    smartIcon: { backgroundColor: '#fef3c7' },
    smartIconActive: { backgroundColor: '#d97706' },
    categoryTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
    categorySubtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
    schedulePanel: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#99f6e4' },
    schedulePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
    schedulePanelTitle: { flex: 1, color: '#115e59', fontSize: 13, fontWeight: '800' },
    timeOptions: { gap: 7 },
    timeOption: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccfbf1' },
    timeOptionActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
    timeOptionText: { color: '#334155', fontSize: 12, fontWeight: '600' },
    timeOptionTextActive: { color: '#fff' },
    smartPanel: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
    smartPanelCopy: { flex: 1 },
    smartPanelTitle: { color: '#92400e', fontSize: 13, fontWeight: '800' },
    smartPanelText: { color: '#78350f', fontSize: 11, lineHeight: 16, marginTop: 2 },
    smartPremium: { color: '#b45309', fontSize: 14, fontWeight: '900' },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    rowPressed: { backgroundColor: '#f8fafc' },
    destinationTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    destinationSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
});
