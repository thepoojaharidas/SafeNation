import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { darkTheme, lightTheme } from "../theme/colors";

// Singapore's key emergency contacts including both voice call and SMS options
// SMS numbers included for users who are unable to make voice calls during emergencies
const emergencyContacts = [
  {
    id: "1",
    title: "Police Emergency",
    number: "999",
    description: "For urgent police assistance and immediate danger.",
    icon: "shield-checkmark-outline",
    color: "#2563EB",
  },
  {
    id: "2",
    title: "SCDF Ambulance / Fire",
    number: "995",
    description: "For fire, rescue, and life-threatening medical emergencies.",
    icon: "medical-outline",
    color: "#DC2626",
  },
  {
    id: "3",
    title: "Non-Emergency Ambulance",
    number: "1777",
    description: "For medical transport that is not life-threatening.",
    icon: "car-outline",
    color: "#059669",
  },
  {
    id: "4",
    title: "Police Emergency SMS",
    number: "70999",
    description: "SMS service for people who are unable to make a voice call.",
    icon: "chatbox-ellipses-outline",
    color: "#7C3AED",
  },
  {
    id: "5",
    title: "SCDF Emergency SMS",
    number: "70995",
    description: "SMS service for people who are unable to make a voice call.",
    icon: "mail-outline",
    color: "#EA580C",
  },
];

export default function EmergencyContactsScreen() {
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // Open the phone dialer directly with the number pre-filled
  const makeCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  // Open the SMS app with the number pre-filled
  const sendSMS = (number) => {
    Linking.openURL(`sms:${number}`);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {emergencyContacts.map((item) => {
          // Check if the contact is an SMS service based on the title
          // This determines whether tapping the button opens the phone dialer or SMS app
          const isSMS = item.title.toLowerCase().includes("sms");

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.borderSoft,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: darkModeEnabled
                        ? `${item.color}22`
                        : `${item.color}15`,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>

                <View style={styles.textWrap}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.numberRow,
                  {
                    backgroundColor: colors.cardSoft,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.numberLabel, { color: colors.textSecondary }]}
                >
                  Contact Number
                </Text>
                <Text style={[styles.numberText, { color: colors.text }]}>
                  {item.number}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: item.color }]}
                onPress={() =>
                  isSMS ? sendSMS(item.number) : makeCall(item.number)
                }
              >
                <Ionicons
                  name={isSMS ? "chatbubble-ellipses-outline" : "call-outline"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>
                  {isSMS ? "Send SMS" : "Call Now"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: darkModeEnabled ? colors.primarySoft : "#FFFFFF",
              borderColor: darkModeEnabled ? colors.border : "transparent",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text
            style={[
              styles.infoText,
              { color: darkModeEnabled ? colors.textSecondary : "#475569" },
            ]}
          >
            Call emergency numbers only for urgent situations. Use non-emergency
            services when immediate life-saving response is not required.
          </Text>
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
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  numberRow: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  numberLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  numberText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  actionButton: {
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  tipCard: {
    marginTop: 6,
    borderRadius: 18,
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
