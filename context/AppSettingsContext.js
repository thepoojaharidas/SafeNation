import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// key used to save dark mode preference locally
const DARK_MODE_KEY = "app_dark_mode_enabled";

// create global app settings context
const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  // store app settings state and loading status
  const [darkModeEnabled, setDarkModeEnabledState] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);

  // load saved app settings when provider mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);

        if (savedDarkMode !== null) {
          setDarkModeEnabledState(savedDarkMode === "true");
        }
      } catch (error) {
        console.log("Error loading app settings:", error);
      } finally {
        setSettingsReady(true);
      }
    };

    loadSettings();
  }, []);

  // update dark mode state and save it locally
  const setDarkModeEnabled = async (value) => {
    try {
      setDarkModeEnabledState(value);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(value));
    } catch (error) {
      console.log("Error saving dark mode setting:", error);
    }
  };

  const t = (key) => key;

  // memoize context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      darkModeEnabled,
      setDarkModeEnabled,
      settingsReady,
      t,
    }),
    [darkModeEnabled, settingsReady],
  );

  // provide app settings to all child components
  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// custom hook for accessing app settings context
export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  // ensure hook is only used inside provider
  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }

  return context;
}
