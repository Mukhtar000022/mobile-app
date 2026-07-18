import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Balloon({ size = 32 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <LinearGradient
        colors={['#FBB89C', '#ED7A4E', '#D85A30']}
        start={{ x: 0.3, y: 0.25 }}
        end={{ x: 0.8, y: 0.9 }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      />
      <View style={[styles.string, { left: size / 2 - 1, top: size - 3, height: size * 0.35 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  circle: {
    shadowColor: '#ed7a4e',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  string: { position: 'absolute', width: 2, backgroundColor: '#D85A30' },
});
