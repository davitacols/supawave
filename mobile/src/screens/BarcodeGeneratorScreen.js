import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BarcodeGeneratorScreen({ navigation }) {
  const { theme } = useTheme();
  
  const testProducts = [
    { id: 1, name: 'Coca Cola', sku: 'PROD001' },
    { id: 2, name: 'Bread Loaf', sku: 'PROD002' },
    { id: 3, name: 'Rice Bag', sku: 'PROD003' },
    { id: 4, name: 'Cooking Oil', sku: 'PROD004' },
    { id: 5, name: 'Milk Carton', sku: 'PROD005' },
  ];

  const ProductItem = ({ item }) => (
    <View style={[styles.productCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.sku, { color: theme.textSecondary }]}>SKU: {item.sku}</Text>
      <View style={styles.barcode}>
        <Text style={[styles.barcodeText, { color: theme.text }]}>||||| |||| ||||| ||||</Text>
        <Text style={[styles.barcodeNumber, { color: theme.textSecondary }]}>{item.sku}</Text>
      </View>
      <Text style={[styles.instruction, { color: theme.textTertiary }]}>
        Generate barcode for "{item.sku}" online and print to test
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Test Barcodes</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={testProducts}
        renderItem={ProductItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  productCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sku: {
    fontSize: 14,
    marginBottom: 16,
  },
  barcode: {
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeText: {
    fontSize: 24,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  barcodeNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instruction: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});