import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";
import { getCurrentUser } from "../services/AuthService";
import { darkTheme, lightTheme } from "../theme/colors";

// base key used to store emergency contacts per user
const CONTACTS_KEY = "emergency_contacts_v2";

export default function SOSScreen() {
  // get current theme setting and apply correct colors
  const { darkModeEnabled } = useAppSettings();
  const colors = darkModeEnabled ? darkTheme : lightTheme;

  // store contact inputs, saved contacts, and SOS state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  // load saved contacts when screen mounts
  useEffect(() => {
    loadContacts();
  }, []);

  // generate user-specific storage key to keep contacts separate
  const getContactsKey = async () => {
    try {
      const user = await getCurrentUser();
      const scope =
        user?.email?.trim().toLowerCase() ||
        user?.name?.trim().toLowerCase().replace(/\s+/g, "_") ||
        "guest";
      return `${CONTACTS_KEY}_${scope}`;
    } catch (error) {
      return `${CONTACTS_KEY}_guest`;
    }
  };

  // retrieve saved contacts from local storage
  const loadContacts = async () => {
    try {
      const key = await getContactsKey();
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setContacts(JSON.parse(saved));
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.log("Error loading contacts:", error);
    }
  };

  // save updated contact list to local storage
  const saveContacts = async (updatedContacts) => {
    try {
      const key = await getContactsKey();
      await AsyncStorage.setItem(key, JSON.stringify(updatedContacts));
      setContacts(updatedContacts);
    } catch (error) {
      console.log("Error saving contacts:", error);
    }
  };

  // validate and add a new emergency contact
  const handleAddContact = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      Alert.alert(
        "Missing details",
        "Please enter both name and phone number.",
      );
      return;
    }

    const cleanedPhone = trimmedPhone.replace(/\s+/g, "");

    const newContact = {
      id: Date.now().toString(),
      name: trimmedName,
      phone: cleanedPhone,
    };

    const updatedContacts = [...contacts, newContact];
    await saveContacts(updatedContacts);

    setName("");
    setPhone("");
    setShowAddContact(false);
  };

  // remove selected contact from list
  const handleDeleteContact = async (id) => {
    const updatedContacts = contacts.filter((item) => item.id !== id);
    await saveContacts(updatedContacts);
  };

  // initiate phone call to selected number
  const handleCall = async (number) => {
    const url = `tel:${number}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Unable to call", "Your phone app could not be opened.");
    }
  };

  // get current location and format emergency message
  const getLocationMessage = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return "Emergency! I need help. My location could not be accessed.";
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      return `Emergency! I need help. My location: https://maps.google.com/?q=${latitude},${longitude}`;
    } catch (error) {
      console.log("Location error:", error);
      return "Emergency! I need help. My location could not be accessed.";
    }
  };

  // send SOS message to all contacts with location
  const triggerSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        "No contacts added",
        "Please add at least one emergency contact first.",
      );
      return;
    }

    setLoadingSOS(true);

    try {
      const message = await getLocationMessage();
      const recipients = contacts.map((contact) => contact.phone);

      const isAvailable = await SMS.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("SMS unavailable", "SMS is not available on this device.");
        setLoadingSOS(false);
        return;
      }

      await SMS.sendSMSAsync(recipients, message);
    } catch (error) {
      console.log("SOS error:", error);
      Alert.alert("Error", "Unable to open the messages app.");
    } finally {
      setLoadingSOS(false);
    }
  };

  // confirm before sending SOS alert
  const confirmSOS = () => {
    Alert.alert(
      "Send SOS Alert?",
      "This will open your messages app and prepare an emergency message with your location.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send", style: "destructive", onPress: triggerSOS },
      ],
    );
  };

  // render each saved contact in the list
  const renderContact = ({ item }) => (
    <View style={[styles.contactRow, { borderBottomColor: colors.borderSoft }]}>
      <View style={styles.contactInfo}>
        <View
          style={[
            styles.contactAvatar,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <Ionicons name="person-outline" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.contactName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
            {item.phone}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => handleDeleteContact(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: darkModeEnabled
                    ? colors.dangerSoft
                    : "#FEE2E2",
                },
              ]}
            >
              <Ionicons name="warning-outline" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Emergency Assistance
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: colors.textSecondary }]}
              >
                Quickly alert trusted contacts and call emergency services.
              </Text>
            </View>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickBlue]}
              onPress={() => handleCall("995")}
            >
              <Ionicons name="medical-outline" size={18} color="#2563EB" />
              <Text style={styles.quickBlueText}>Call 995</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickRed]}
              onPress={() => handleCall("999")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#DC2626"
              />
              <Text style={styles.quickRedText}>Call 999</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionBtn,
                styles.quickGreen,
                styles.fullWidthAction,
              ]}
              onPress={() => handleCall("1777")}
            >
              <Ionicons name="call-outline" size={18} color="#10B981" />
              <Text style={styles.quickGreenText}>Call 1777</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sosButton, loadingSOS && { opacity: 0.7 }]}
            onPress={confirmSOS}
            disabled={loadingSOS}
            activeOpacity={0.9}
          >
            <View style={styles.sosInner}>
              <View style={styles.sosIconCircle}>
                <Ionicons name="warning" size={18} color="#fff" />
              </View>
              <Text style={styles.sosButtonText}>
                {loadingSOS ? "Preparing SOS..." : "Send SOS Alert"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.contactsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Emergency Contacts
            </Text>

            <TouchableOpacity
              style={[
                styles.smallAddButton,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: darkModeEnabled ? colors.border : "#DBEAFE",
                },
              ]}
              onPress={() => setShowAddContact(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text
                style={[styles.smallAddButtonText, { color: colors.primary }]}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {contacts.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No contacts added yet.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Add a trusted contact so you can send an SOS alert quickly.
              </Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={renderContact}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomNote}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.bottomNoteText, { color: colors.textSecondary }]}
          >
            Use SOS only when immediate help is needed.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAddContact}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddContact(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={12}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Emergency Contact
              </Text>
              <TouchableOpacity onPress={() => setShowAddContact(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardSoft,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardSoft,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Phone Number"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddContact}
            >
              <Text style={styles.saveButtonText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 25,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  quickActionBtn: {
    width: "48%",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  fullWidthAction: {
    width: "100%",
  },
  quickBlue: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  quickRed: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  quickGreen: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  quickBlueText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  quickRedText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  quickGreenText: {
    color: "#10B981",
    fontWeight: "700",
  },
  sosButton: {
    backgroundColor: "#E82127",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#E82127",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginTop: 4,
  },
  sosInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  sosIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
  },
  contactsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  smallAddButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  smallAddButtonText: {
    fontWeight: "700",
    marginLeft: 4,
  },
  emptyStateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  bottomNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bottomNoteText: {
    marginLeft: 6,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
});
