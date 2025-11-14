import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/userService";
import { simpleGoogleSignIn } from "../services/googleAuthService";
import { handleError, showSuccess } from "../services/errorHandlingService";
import { validateForm, commonRules } from "../utils/validation";
import i18n from "../localization/i18n";

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // האזנה לשינויים במצב האימות
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const validateAuthForm = () => {
    const rules = {
      email: commonRules.email,
      password: commonRules.password,
    };

    if (!isLogin) {
      rules.name = commonRules.name;
      rules.confirmPassword = [commonRules.passwordConfirm(password)];
    }

    const errors = validateForm({ email, password, name, confirmPassword }, rules);
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert(i18n.t('common.error'), firstError);
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateAuthForm()) return;

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, name);
      }

      if (result.success) {
        // Reset form fields
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        showSuccess(
          isLogin ? i18n.t('auth.loginSuccess') : i18n.t('auth.registrationSuccess')
        );
      } else {
        handleError(result.error, isLogin ? 'loginUser' : 'registerUser');
      }
    } catch (error) {
      handleError(error, isLogin ? 'loginUser' : 'registerUser');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await simpleGoogleSignIn();
      
      if (result.requiresDevBuild) {
        // Show informative message about development build requirement
        Alert.alert(
          'Google Sign In Not Available',
          result.error,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (result.success) {
        // This case is for future when Google Sign In works
        const googleUser = result.user;
        const firebaseResult = await registerUser(googleUser.email, 'google-auth-' + googleUser.id, googleUser.name);
        
        if (firebaseResult.success) {
          showSuccess(i18n.t('auth.loginSuccess'));
        } else {
          // If user already exists, try to login
          const loginResult = await loginUser(googleUser.email, 'google-auth-' + googleUser.id);
          if (loginResult.success) {
            showSuccess(i18n.t('auth.loginSuccess'));
          } else {
            handleError(loginResult.error, 'googleSignIn');
          }
        }
      } else {
        if (result.error !== 'Login cancelled') {
          handleError(result.error, 'googleSignIn');
        }
      }
    } catch (error) {
      handleError(error, 'googleSignIn');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    if (error?.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return i18n.t('auth.emailAlreadyInUse');
        case 'auth/invalid-email':
          return i18n.t('auth.invalidEmail');
        case 'auth/user-not-found':
          return i18n.t('auth.userNotFound');
        case 'auth/wrong-password':
          return i18n.t('auth.wrongPassword');
        case 'auth/weak-password':
          return i18n.t('auth.weakPassword');
        default:
          return error.message || (isLogin ? i18n.t('auth.loginError') : i18n.t('auth.registrationError'));
      }
    }
    return error?.message || (isLogin ? i18n.t('auth.loginError') : i18n.t('auth.registrationError'));
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      showSuccess(i18n.t('auth.logoutSuccess'));
    } catch (error) {
      handleError(error, 'logoutUser');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // איפוס הטופס
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.appIcon}>💜</Text>
          <Text style={styles.appName}>CoupleTasks</Text>
          <Text style={styles.subtitle}>Together we organize</Text>
        </View>

        {user ? (
          // אם המשתמש מחובר, הצג את המידע שלו
          <View style={styles.userInfoContainer}>
            <View style={styles.userCard}>
              <Text style={styles.welcomeText}>{i18n.t('common.welcome')}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.logoutButtonText}>{i18n.t('auth.signOut')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // אם אין משתמש מחובר, הצג טופס הרשמה/כניסה
          <View style={styles.formContainer}>
            <Text style={styles.title}>
              {isLogin ? i18n.t('auth.signIn') : i18n.t('auth.signUp')}
            </Text>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{i18n.t('auth.fullName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('auth.enterFullName')}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={i18n.t('auth.enterEmail')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={i18n.t('auth.enterPassword')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{i18n.t('auth.confirmPassword')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <TouchableOpacity 
              style={styles.authButton} 
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {isLogin ? i18n.t('auth.signIn') : i18n.t('auth.createAccount')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>או</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={[styles.googleButton, styles.disabledGoogleButton]} 
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>🔍</Text>
              <View style={styles.googleButtonContent}>
                <Text style={styles.googleButtonText}>{i18n.t('auth.signInWithGoogle')}</Text>
                <Text style={styles.googleButtonSubtext}>(Requires Dev Build)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleAuthMode}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin ? i18n.t('auth.noAccount') : i18n.t('auth.hasAccount')}
              </Text>
              <Text style={styles.toggleButtonAction}>
                {isLogin ? i18n.t('auth.createAccount') : i18n.t('auth.loginToAccount')}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{i18n.t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  appIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#1F2937",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "white",
    textAlign: "right",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  authButton: {
    backgroundColor: "#8B5CF6",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  authButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  googleButton: {
    backgroundColor: "white",
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledGoogleButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleButtonContent: {
    alignItems: 'center',
  },
  googleButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButtonSubtext: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  toggleButton: {
    alignItems: "center",
    marginVertical: 16,
  },
  toggleButtonText: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 4,
  },
  toggleButtonAction: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "#8B5CF6",
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  userInfoContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    justifyContent: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;
