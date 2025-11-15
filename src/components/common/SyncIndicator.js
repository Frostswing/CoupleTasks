import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import syncIndicatorService from '../../services/syncIndicatorService';

export default function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = syncIndicatorService.subscribe(({ isSyncing: syncing, message: msg }) => {
      setIsSyncing(syncing);
      setMessage(msg);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isSyncing) {
      // Start rotation animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotate.start();
    } else {
      // Stop animation
      rotateAnim.setValue(0);
    }
  }, [isSyncing]);

  if (!isSyncing) {
    return null;
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Icon name="sync" size={18} color="#FFFFFF" />
      </Animated.View>
      {message && (
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  message: {
    marginLeft: 6,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    maxWidth: 80,
  },
});

