import AsyncStorage from "@react-native-async-storage/async-storage";

// keys used to store user data and login status locally
const USER_KEY = "app_user";
const LOGGED_IN_KEY = "is_logged_in";

// save new user details and mark user as logged in
export async function registerUser(name, email, password) {
  const user = {
    name,
    email,
    password,
  };

  await AsyncStorage.setItem("app_user", JSON.stringify(user));
  await AsyncStorage.setItem("is_logged_in", "true");

  return { success: true };
}

// validate user credentials against stored dat
export async function loginUser(email, password) {
  try {
    const savedUser = await AsyncStorage.getItem(USER_KEY);

    // return error if no account is found in storage
    if (!savedUser) {
      return {
        success: false,
        message: "No account found. Please sign up first.",
      };
    }

    const parsedUser = JSON.parse(savedUser);

    // check if entered email and password match stored user data
    if (
      parsedUser.email === email.trim().toLowerCase() &&
      parsedUser.password === password.trim()
    ) {
      await AsyncStorage.setItem(LOGGED_IN_KEY, "true");
      return { success: true };
    }

    return { success: false, message: "Invalid email or password." };
  } catch (error) {
    return { success: false, message: "Login failed." };
  }
}

// clear login status when user logs out
export async function logoutUser() {
  try {
    await AsyncStorage.removeItem(LOGGED_IN_KEY);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// check if user is currently logged in
export async function isUserLoggedIn() {
  try {
    const value = await AsyncStorage.getItem(LOGGED_IN_KEY);
    return value === "true";
  } catch (error) {
    return false;
  }
}

// retrieve stored user details from local storage
export async function getCurrentUser() {
  try {
    const savedUser = await AsyncStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
}
