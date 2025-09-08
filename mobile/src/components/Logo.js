import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo({ size = 'large', theme }) {
  const isLarge = size === 'large';
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={[
          styles.logoText,
          isLarge && styles.logoTextLarge
        ]}>
          <Text style={styles.normalText}>S</Text>
          <Text style={styles.italicText}>u</Text>
          <Text style={styles.normalText}>p</Text>
          <Text style={styles.italicText}>a</Text>
          <Text style={styles.boldText}>W</Text>
          <Text style={styles.italicText}>a</Text>
          <Text style={styles.normalText}>v</Text>
          <Text style={styles.italicText}>e</Text>
        </Text>
        {isLarge && (
          <Text style={[styles.tagline, { color: theme?.textSecondary || '#64748b' }]}>
            Inventory Management
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  logoTextLarge: {
    fontSize: 42,
    letterSpacing: -2,
    textAlign: 'center',
  },
  normalText: {
    color: '#3b82f6',
    fontWeight: '800',
  },
  italicText: {
    color: '#3b82f6',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  boldText: {
    color: '#3b82f6',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});