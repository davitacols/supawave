import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useOffline } from '../context/OfflineContext';
import { offlineStorage } from '../services/offlineStorage';

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isOnline } = useOffline();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      let data;
      if (isOnline) {
        data = await inventoryAPI.getProducts();
        await offlineStorage.saveProducts(data.results || data);
      } else {
        data = await offlineStorage.getProducts();
      }
      setProducts(data.results || data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      const offlineData = await offlineStorage.getProducts();
      setProducts(offlineData);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: '#ef4444' };
    if (quantity <= 10) return { text: 'Low Stock', color: '#f59e0b' };
    return { text: 'In Stock', color: '#10b981' };
  };

  const ProductItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock_quantity);
    
    return (
      <View style={[styles.productItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.productHeader}>
          <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: stockStatus.color }]}>
            <Text style={styles.statusText}>{stockStatus.text}</Text>
          </View>
        </View>
        
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>SKU:</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{item.sku || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category:</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{item.category_name || 'Uncategorized'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Quantity:</Text>
            <Text style={[styles.detailValue, { color: stockStatus.color, fontWeight: '600' }]}>
              {item.stock_quantity}
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Cost Price</Text>
              <Text style={[styles.priceValue, { color: theme.success }]}>₦{item.cost_price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Selling Price</Text>
              <Text style={[styles.priceValue, { color: theme.success }]}>₦{item.selling_price}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{products.length} products</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products..."
          placeholderTextColor={theme.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={ProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.success }]}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});