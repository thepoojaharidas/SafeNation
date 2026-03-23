import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  fetchFloodAlerts,
  fetchPSI,
  fetchRainfall,
  fetchWeatherForecast,
} from "../services/alertsService";
import { darkTheme, lightTheme } from "../theme/colors";

// Main alerst screen displaying weather, PSI and flood data on map and cards
export default function AlertsScreen({ navigation }) {
  // get current theme (dark/light mode)
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // loading + refresh states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // fallback is APIs fail
  const [dataUnavailable, setDataUnavailable] = useState(false);

  // main displayed data
  const [weatherText, setWeatherText] = useState("No forecast available.");
  const [psiValue, setPsiValue] = useState(null);
  const [floodItems, setFloodItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  // map markers for each dataset
  const [weatherMarkers, setWeatherMarkers] = useState([]);
  const [psiMarkers, setPsiMarkers] = useState([]);
  const [floodMarkers, setFloodMarkers] = useState([]);

  // rainfall-specific states
  const [rainStations, setRainStations] = useState([]);
  const [rainExpanded, setRainExpanded] = useState(false);
  const [heavyRainActive, setHeavyRainActive] = useState(false);
  const [rainfallRateLimited, setRainfallRateLimited] = useState(false);

  // helper: safely extract lat/lng from diff API formats
  // APIs are inconsistent so we check multiple possible fields
  const getLatLng = (obj) => {
    const lat =
      obj?.latitude ??
      obj?.lat ??
      obj?.location?.latitude ??
      obj?.location?.lat ??
      obj?.label_location?.latitude ??
      obj?.label_location?.lat;

    const lng =
      obj?.longitude ??
      obj?.lng ??
      obj?.long ??
      obj?.location?.longitude ??
      obj?.location?.lng ??
      obj?.label_location?.longitude ??
      obj?.label_location?.lng;

    // return only if valid numbers
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

  // helper: get most common weather forecast across all areas
  // gives a small summary instead of listing everything
  const getMostCommonForecast = (forecasts = []) => {
    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return "No forecast available.";
    }

    const counts = forecasts.reduce((acc, item) => {
      const label = item?.forecast?.trim();
      if (!label) return acc;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // helper: derive a single PSI value for display
    // prefer national value, otherwise take worst region
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "No forecast available.";
  };

  const getNationalPsiReading = (psiItem) => {
    const twentyFourHourly = psiItem?.readings?.psi_twenty_four_hourly;
    if (!twentyFourHourly) return null;

    if (
      twentyFourHourly.national !== undefined &&
      twentyFourHourly.national !== null
    ) {
      return twentyFourHourly.national;
    }

    // fallback: take max of regions (worst-case)
    const regionalValues = ["west", "east", "central", "north", "south"]
      .map((region) => twentyFourHourly?.[region])
      .filter((value) => value !== undefined && value !== null);

    if (regionalValues.length === 0) return null;

    return Math.max(...regionalValues);
  };

  // main function: fetch all alert data
  const loadAlerts = async () => {
    // show loader only on first load
    if (!refreshing && !lastUpdated) {
      setLoading(true);
    }

    try {
      // fetch all APIs in parallel for performance
      const [weatherData, psiData, floodData, rainfallData] = await Promise.all(
        [
          fetchWeatherForecast(),
          fetchPSI(),
          fetchFloodAlerts(),
          fetchRainfall(),
        ],
      );

      // if everything failed, show fallback UI
      const allFailed = !weatherData && !psiData && !floodData && !rainfallData;
      setDataUnavailable(allFailed);

      const areaMetadata =
        weatherData?.data?.area_metadata || weatherData?.area_metadata || [];

      // --- WEATHER ---
      const forecasts =
        weatherData?.data?.items?.[0]?.forecasts ||
        weatherData?.items?.[0]?.forecasts ||
        [];

      setWeatherText(getMostCommonForecast(forecasts));

      const weatherMapMarkers = areaMetadata
        .map((area) => {
          const coords = getLatLng(area);
          if (!coords) return null;

          const forecastMatch = forecasts.find(
            (f) => f?.area?.toLowerCase() === area?.name?.toLowerCase(),
          );

          return {
            id: `weather-${area?.name}`,
            title: area?.name || "Area",
            description: forecastMatch?.forecast || "No forecast",
            ...coords,
          };
        })
        .filter(Boolean);

      setWeatherMarkers(weatherMapMarkers);

      // --- RAINFALL ---
      if (rainfallData?.rateLimited) {
        setRainfallRateLimited(true);
        setRainStations([]);
        setHeavyRainActive(false);
      } else {
        setRainfallRateLimited(false);

        const stationsMeta = Array.isArray(rainfallData?.data?.stations)
          ? rainfallData.data.stations
          : [];

        const rainfallWrapper = Array.isArray(rainfallData?.data?.readings)
          ? rainfallData.data.readings[0]
          : null;

        const rainfallReadings = Array.isArray(rainfallWrapper?.data)
          ? rainfallWrapper.data
          : [];

        const stationRows = rainfallReadings
          .map((reading, index) => {
            const stationMeta = stationsMeta.find(
              (station) => station?.id === reading?.stationId,
            );

            const value = Number(reading?.value ?? 0);

            let status = "Normal";
            let statusColor = colors.success;

            if (value >= 15) {
              status = "Heavy";
              statusColor = colors.danger;
            } else if (value >= 5) {
              status = "Moderate";
              statusColor = colors.warning;
            }

            return {
              id: reading?.stationId || `station-${index}`,
              name:
                stationMeta?.name ||
                reading?.stationId ||
                `Station ${index + 1}`,
              rainfall: value,
              status,
              statusColor,
              latitude: stationMeta?.location?.latitude ?? null,
              longitude: stationMeta?.location?.longitude ?? null,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setRainStations(stationRows);
        setHeavyRainActive(
          stationRows.some((station) => station.rainfall >= 15),
        );
      }

      // --- PSI ---
      const psiItem = psiData?.data?.items?.[0] || psiData?.items?.[0];
      const regionMetadata =
        psiData?.data?.region_metadata || psiData?.region_metadata || [];

      const nationalPsi = getNationalPsiReading(psiItem);
      setPsiValue(nationalPsi);

      const psiMapMarkers = regionMetadata
        .map((region) => {
          const coords = getLatLng(region);
          if (!coords) return null;

          const regionName = region?.name;
          const reading =
            psiItem?.readings?.psi_twenty_four_hourly?.[regionName] ?? null;

          return {
            id: `psi-${regionName}`,
            title: `${
              regionName?.[0]?.toUpperCase() + regionName?.slice(1)
            } PSI`,
            description:
              reading !== null && reading !== undefined
                ? `PSI: ${reading}`
                : "No PSI reading",
            reading,
            ...coords,
          };
        })
        .filter(Boolean);

      setPsiMarkers(psiMapMarkers);

      // --- FLOOD ---
      const floodList =
        floodData?.data?.items || floodData?.items || floodData?.data || [];

      const cleanedFloodList = Array.isArray(floodList) ? floodList : [];
      setFloodItems(cleanedFloodList);

      const floodMapMarkers = cleanedFloodList
        .map((item, index) => {
          const coords = getLatLng(item);
          if (!coords) return null;

          return {
            id: `flood-${index}`,
            title: item?.name || item?.location || item?.area || "Flood alert",
            description: "Active flood / flash flood alert",
            ...coords,
          };
        })
        .filter(Boolean);

      setFloodMarkers(floodMapMarkers);

      // update last refreshed time
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (error) {
      console.error("Load alerts error:", error);
      setDataUnavailable(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // reload data whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, []),
  );

  // pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const hazeInfo = useMemo(() => {
    if (psiValue === null || psiValue === undefined) {
      return {
        label: "Unknown",
        color: colors.textMuted,
        bg: colors.cardMuted,
        advice: "Unable to retrieve haze reading right now.",
      };
    }

    if (psiValue <= 50) {
      return {
        label: "Good",
        color: colors.success,
        bg: colors.successSoft,
        advice: "Air quality is good for normal outdoor activity.",
      };
    }

    if (psiValue <= 100) {
      return {
        label: "Moderate",
        color: colors.warning,
        bg: colors.warningSoft,
        advice:
          "Air quality is acceptable, but sensitive groups should monitor symptoms.",
      };
    }

    if (psiValue <= 200) {
      return {
        label: "Unhealthy",
        color: colors.danger,
        bg: colors.dangerSoft,
        advice: "Reduce prolonged outdoor activity, especially if sensitive.",
      };
    }

    if (psiValue <= 300) {
      return {
        label: "Very Unhealthy",
        color: colors.purple,
        bg: colors.purpleSoft,
        advice: "Limit outdoor exposure and wear a mask if necessary.",
      };
    }

    return {
      label: "Hazardous",
      color: colors.text,
      bg: colors.border,
      advice: "Avoid outdoor activity and follow official guidance closely.",
    };
  }, [psiValue, colors]);

  const floodInfo = useMemo(() => {
    if (!Array.isArray(floodItems) || floodItems.length === 0) {
      return {
        active: false,
        title: "No active flood alerts",
        subtitle: "No current flash flood warnings reported.",
        color: colors.success,
        bg: colors.successSoft,
      };
    }

    const firstFlood = floodItems[0];
    const firstLocation =
      firstFlood?.name ||
      firstFlood?.location ||
      firstFlood?.area ||
      "Affected area";

    return {
      active: true,
      title: "Flash flood alert",
      subtitle: `Reported near ${firstLocation}`,
      color: colors.danger,
      bg: colors.dangerSoft,
    };
  }, [floodItems, colors]);

  const displayedRainStations = rainExpanded ? rainStations : [];

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading live alerts...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Alert Centre
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Live weather, haze, and flood updates for Singapore
          </Text>
          {!!lastUpdated && (
            <Text style={[styles.updatedText, { color: colors.textMuted }]}>
              Last updated: {lastUpdated}
            </Text>
          )}
        </View>

        {dataUnavailable && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.primaryInfo, { color: colors.text }]}>
              Live data temporarily unavailable
            </Text>
            <Text
              style={[styles.secondaryInfo, { color: colors.textSecondary }]}
            >
              Please try again in a moment or pull down to refresh.
            </Text>
          </View>
        )}

        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconWrap}>
              <Ionicons name="warning-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.overviewTitle}>Live Alert Overview</Text>
              <Text style={styles.overviewSubtitle}>
                {floodInfo.active
                  ? "Flood risk detected. Stay alert and monitor affected areas."
                  : "No major active environmental alert right now."}
              </Text>
            </View>
          </View>

          <View style={styles.overviewChipsRow}>
            <View style={styles.overviewChip}>
              <Ionicons name="partly-sunny-outline" size={16} color="#FFFFFF" />
              <Text style={styles.overviewChipText} numberOfLines={1}>
                {weatherText}
              </Text>
            </View>

            <View style={styles.overviewChip}>
              <Ionicons name="cloudy-outline" size={16} color="#FFFFFF" />
              <Text style={styles.overviewChipText}>
                {psiValue !== null && psiValue !== undefined
                  ? `PSI ${psiValue} • ${hazeInfo.label}`
                  : "PSI unavailable"}
              </Text>
            </View>
          </View>

          <MapView
            style={styles.map}
            userInterfaceStyle={darkModeEnabled ? "dark" : "light"}
            initialRegion={{
              latitude: 1.3521,
              longitude: 103.8198,
              latitudeDelta: 0.22,
              longitudeDelta: 0.22,
            }}
          >
            {weatherMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                description={marker.description}
                pinColor="green"
              />
            ))}

            {psiMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                description={marker.description}
                pinColor="orange"
              />
            ))}

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

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "green" }]} />
              <Text style={styles.legendText}>Weather</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "orange" }]} />
              <Text style={styles.legendText}>Haze</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "red" }]} />
              <Text style={styles.legendText}>Flood</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBadge, { backgroundColor: hazeInfo.bg }]}>
              <Ionicons
                name="cloudy-outline"
                size={20}
                color={hazeInfo.color}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Haze / PSI
              </Text>
              <Text
                style={[styles.sectionSmall, { color: colors.textSecondary }]}
              >
                24-hour PSI reading
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                { backgroundColor: hazeInfo.bg, borderColor: hazeInfo.color },
              ]}
            >
              <Text style={[styles.statusPillText, { color: hazeInfo.color }]}>
                {hazeInfo.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.largeReading, { color: colors.text }]}>
            {psiValue !== null && psiValue !== undefined ? psiValue : "--"}
          </Text>
          <Text style={[styles.secondaryInfo, { color: colors.textSecondary }]}>
            {hazeInfo.advice}
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.collapseHeader}
            onPress={() => setRainExpanded(!rainExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeaderLeft}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name="rainy-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Weather Alerts (NEA)
                </Text>
                <Text
                  style={[styles.sectionSmall, { color: colors.textSecondary }]}
                >
                  Rainfall stations across Singapore
                </Text>
              </View>
            </View>

            <Ionicons
              name={rainExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.alertStatusBox,
              {
                borderColor: colors.border,
                backgroundColor: colors.cardSoft,
              },
            ]}
          >
            <View style={styles.alertStatusRow}>
              <Text style={[styles.alertStatusLabel, { color: colors.text }]}>
                Heavy Rain:
              </Text>
              <Text
                style={[
                  styles.alertStatusValue,
                  { color: heavyRainActive ? colors.danger : colors.success },
                ]}
              >
                {heavyRainActive ? "Yes" : "No"}
              </Text>
            </View>

            <View style={[styles.alertStatusRow, { marginBottom: 0 }]}>
              <Text style={[styles.alertStatusLabel, { color: colors.text }]}>
                Flood Warning:
              </Text>
              <Text
                style={[
                  styles.alertStatusValue,
                  {
                    color:
                      floodItems.length > 0 ? colors.danger : colors.success,
                  },
                ]}
              >
                {floodItems.length > 0 ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          {rainExpanded && (
            <View style={styles.stationTable}>
              <View
                style={[
                  styles.stationTableHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.stationHeaderText,
                    { flex: 1.8, color: colors.text },
                  ]}
                >
                  Station
                </Text>
                <Text
                  style={[
                    styles.stationHeaderText,
                    { flex: 1, textAlign: "center", color: colors.text },
                  ]}
                >
                  Rainfall (mm)
                </Text>
                <Text
                  style={[
                    styles.stationHeaderText,
                    { flex: 1, textAlign: "right", color: colors.text },
                  ]}
                >
                  Status
                </Text>
              </View>

              {rainfallRateLimited ? (
                <Text
                  style={[
                    styles.emptyStationText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Rainfall data is temporarily busy. Please refresh again
                  shortly.
                </Text>
              ) : rainStations.length === 0 ? (
                <Text
                  style={[
                    styles.emptyStationText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No rainfall station data available.
                </Text>
              ) : (
                displayedRainStations.map((station) => (
                  <View
                    key={station.id}
                    style={[
                      styles.stationRow,
                      { borderBottomColor: colors.borderSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stationText,
                        { flex: 1.8, color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {station.name}
                    </Text>
                    <Text
                      style={[
                        styles.stationText,
                        { flex: 1, textAlign: "center", color: colors.text },
                      ]}
                    >
                      {station.rainfall.toFixed(1)}
                    </Text>
                    <Text
                      style={[
                        styles.stationStatus,
                        {
                          flex: 1,
                          textAlign: "right",
                          color: station.statusColor,
                        },
                      ]}
                    >
                      {station.status}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: floodInfo.active
                    ? colors.dangerSoft
                    : colors.successSoft,
                },
              ]}
            >
              <Ionicons
                name="water-outline"
                size={20}
                color={floodInfo.active ? colors.danger : colors.success}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Flash Flood Alerts
              </Text>
              <Text
                style={[styles.sectionSmall, { color: colors.textSecondary }]}
              >
                PUB / flood advisory updates
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: floodInfo.bg,
                  borderColor: floodInfo.color,
                },
              ]}
            >
              <Text style={[styles.statusPillText, { color: floodInfo.color }]}>
                {floodInfo.active ? "Active" : "Clear"}
              </Text>
            </View>
          </View>

          <Text style={[styles.primaryInfo, { color: colors.text }]}>
            {floodInfo.title}
          </Text>
          <Text style={[styles.secondaryInfo, { color: colors.textSecondary }]}>
            {floodInfo.subtitle}
          </Text>

          <Pressable
            style={[styles.mapButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.getParent()?.navigate("FlashFloods", { floodItems })
            }
          >
            <Ionicons name="map-outline" size={18} color="#FFFFFF" />
            <Text style={styles.mapButtonText}>See flood locations</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    marginTop: 15,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  updatedText: {
    marginTop: 8,
    fontSize: 14,
  },
  overviewCard: {
    backgroundColor: "#6FA8F7",
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  overviewIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  overviewSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.88)",
  },
  overviewChipsRow: {
    marginBottom: 14,
    gap: 8,
  },
  overviewChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  overviewChipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  map: {
    width: "100%",
    height: 250,
    borderRadius: 18,
    marginTop: 2,
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  sectionSmall: {
    marginTop: 2,
    fontSize: 14,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryInfo: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  secondaryInfo: {
    fontSize: 14,
    lineHeight: 21,
  },
  largeReading: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 8,
  },
  mapButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertStatusBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  alertStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  alertStatusLabel: {
    fontSize: 14,
  },
  alertStatusValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  stationTable: {
    marginTop: 14,
  },
  stationTableHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  stationHeaderText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stationText: {
    fontSize: 13,
  },
  stationStatus: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyStationText: {
    marginTop: 12,
    fontSize: 14,
  },
});
