import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { inventoryAPI } from '../services/api';
import BarcodeGenerator from '../components/BarcodeGenerator';

export default function AddProductScreen({ navigation }) {
  const { theme } = useTheme();
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    low_stock_threshold: '10'
  });
  const [loading, setLoading] = useState(false);

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `SKU${timestamp}${random}`;
  };

  const handleSave = async () => {
    if (!product.name || !product.cost_price || !product.selling_price) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...product,
        cost_price: parseFloat(product.cost_price) || 0,
        selling_price: parseFloat(product.selling_price) || 0,
        stock_quantity: parseInt(product.stock_quantity) || 0,
        low_stock_threshold: parseInt(product.low_stock_threshold) || 10
      };
      
      console.log('Saving product:', productData);
      const result = await inventoryAPI.createProduct(productData);
      console.log('Product saved:', result);
      
      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Add Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Product Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter product name"
              placeholderTextColor={theme.textTertiary}
              value={product.name}
              onChangeText={(text) => setProduct({ ...product, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.skuRow}>
              <Text style={[styles.label, { color: theme.text }]}>SKU</Text>
              <TouchableOpacity 
                style={[styles.generateButton, { backgroundColor: theme.primary }]}
                onPress={() => setProduct({ ...product, sku: generateSKU() })}
              >
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
              placeholder="Product SKU"
              placeholderTextColor={theme.textTertiary}
              value={product.sku}
              onChangeText={(text) => setProduct({ ...product, sku: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Cost Price *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                value={product.cost_price}
                onChangeText={(text) => setProduct({ ...product, cost_price: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Selling Price *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                value={product.selling_price}
                onChangeText={(text) => setProduct({ ...product, selling_price: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Stock Quantity</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.textTertiary}
                value={product.stock_quantity}
                onChangeText={(text) => setProduct({ ...product, stock_quantity: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Low Stock Alert</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="10"
                placeholderTextColor={theme.textTertiary}
                value={product.low_stock_threshold}
                onChangeText={(text) => setProduct({ ...product, low_stock_threshold: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {product.sku && (
            <View style={styles.barcodeSection}>
              <Text style={[styles.label, { color: theme.text }]}>Generated Barcode</Text>
              <BarcodeGenerator value={product.sku} />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.success }, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Product'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  barcodeSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
});