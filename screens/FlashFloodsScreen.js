import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

export default function FlashFloodsScreen({ route }) {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // retrieve flood data passed from previous screen (fallback to empty array)
  const floodItems = route?.params?.floodItems || [];

  // helper function to safely extract latitude and longitude from different possible formats
  const getLatLng = (item) => {
    const lat =
      item?.latitude ??
      item?.lat ??
      item?.location?.latitude ??
      item?.location?.lat ??
      item?.label_location?.latitude ??
      item?.label_location?.lat;

    const lng =
      item?.longitude ??
      item?.lng ??
      item?.long ??
      item?.location?.longitude ??
      item?.location?.lng ??
      item?.label_location?.longitude ??
      item?.label_location?.lng;

    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      return { latitude: lat, longitude: lng };
    }

    return null;
  };
  // convert flood data into map markers (filter out invalid coordinates)
  const floodMarkers = useMemo(() => {
    return floodItems
      .map((item, index) => {
        const coords = getLatLng(item);
        if (!coords) return null;

        return {
          id: `flood-${index}`,
          title:
            item?.name || item?.location || item?.area || `Area ${index + 1}`,
          description: "Active flash flood alert",
          ...coords,
        };
      })
      .filter(Boolean);
  }, [floodItems]);

  // determine map zoom and center based on available markers
  const mapRegion = useMemo(() => {
    if (floodMarkers.length === 1) {
      return {
        latitude: floodMarkers[0].latitude,
        longitude: floodMarkers[0].longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    return {
      latitude: 1.3521,
      longitude: 103.8198,
      latitudeDelta: 0.22,
      longitudeDelta: 0.22,
    };
  }, [floodMarkers]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Flash Flood Affected Areas
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Reported locations from live flood alert data
        </Text>

        <View
          style={[
            styles.mapCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.mapHeader}>
            <Ionicons name="map-outline" size={22} color={colors.primary} />
            <Text style={[styles.mapTitle, { color: colors.text }]}>
              Flood Map
            </Text>
          </View>

          <MapView
            key={`${mapRegion.latitude}-${mapRegion.longitude}-${floodMarkers.length}`}
            style={styles.map}
            userInterfaceStyle={darkModeEnabled ? "dark" : "light"}
            initialRegion={mapRegion}
          >
            {floodMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                description={marker.description}
                pinColor="red"
              />
            ))}
          </MapView>

          {floodMarkers.length === 0 && (
            <Text style={[styles.mapText, { color: colors.textSecondary }]}>
              No precise map coordinates are available in the current flood
              alert data, so the affected areas are listed below instead.
            </Text>
          )}
        </View>

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderSoft,
            },
          ]}
        >
          <Text style={[styles.listTitle, { color: colors.text }]}>
            Affected Areas
          </Text>

          {floodItems.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No active flood-affected areas reported.
            </Text>
          ) : (
            floodItems.map((item, index) => {
              const location =
                item?.name ||
                item?.location ||
                item?.area ||
                `Area ${index + 1}`;

              return (
                <View
                  key={index}
                  style={[
                    styles.areaRow,
                    { borderBottomColor: colors.borderSoft },
                  ]}
                >
                  <Ionicons name="location" size={18} color={colors.danger} />
                  <Text style={[styles.areaText, { color: colors.text }]}>
                    {location}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
  },
  mapCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mapTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
  },
  map: {
    width: "100%",
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
  },
  mapText: {
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
  },
  listCard: {
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  areaText: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
});
