import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { inventoryAPI } from '../services/api';

export default function LowStockScreen({ navigation }) {
  const { theme } = useTheme();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockProducts();
  }, []);

  const loadLowStockProducts = async () => {
    try {
      const data = await inventoryAPI.getLowStock();
      setLowStockProducts(data.results || data);
    } catch (error) {
      console.error('Failed to load low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const ProductItem = ({ item }) => (
    <View style={[styles.productItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.productSku, { color: theme.textSecondary }]}>SKU: {item.sku}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[styles.stockCount, { color: '#ef4444' }]}>{item.stock_quantity}</Text>
        <Text style={[styles.stockLabel, { color: theme.textSecondary }]}>remaining</Text>
      </View>
      <TouchableOpacity 
        style={[styles.restockButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Ionicons name="add" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Low Stock Alert</Text>
        <View style={{ width: 24 }} />
      </View>

      {lowStockProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color={theme.success} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All Good!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            No products are running low on stock
          </Text>
        </View>
      ) : (
        <FlatList
          data={lowStockProducts}
          renderItem={ProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productSku: {
    fontSize: 14,
    marginTop: 2,
  },
  stockInfo: {
    alignItems: 'center',
    marginRight: 16,
  },
  stockCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockLabel: {
    fontSize: 12,
  },
  restockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});