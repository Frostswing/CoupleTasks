import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

const LoadingScreen = ({ status, message }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation for the outer ring
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for the inner heart
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, "#F0FDFA", "#E0F2FE"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* Animated Outer Ring */}
          <Animated.View
            style={[
              styles.ring,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ringGradient}
            />
          </Animated.View>

          {/* Pulsing Heart */}
          <Animated.Text 
            style={[
              styles.emoji,
              { transform: [{ scale: pulseValue }] }
            ]}
          >
            💜
          </Animated.Text>
        </View>

        <Text style={styles.title}>CoupleTasks</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.message}>{message || "Loading..."}</Text>
          {status && (
            <Text style={styles.statusDetails}>
              {typeof status === 'string' ? status : JSON.stringify(status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
    position: 'absolute',
  },
  ringGradient: {
    flex: 1,
    borderRadius: 50,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primaryDark,
    marginBottom: SPACING.m,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  statusDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default LoadingScreen;
