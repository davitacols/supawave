import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { salesAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useOffline } from '../context/OfflineContext';
import { offlineStorage } from '../services/offlineStorage';

export default function SalesScreen() {
  const [sales, setSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const { isOnline } = useOffline();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      let data;
      if (isOnline) {
        data = await salesAPI.getSales();
      } else {
        data = await offlineStorage.getSales();
      }
      setSales(data.results || data || []);
    } catch (error) {
      console.error('Failed to load sales:', error);
      const offlineData = await offlineStorage.getSales();
      setSales(offlineData);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const SaleItem = ({ item }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleId}>Sale #{item.id ? String(item.id).slice(-8) : 'N/A'}</Text>
          <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.saleAmount}>₦{parseFloat(item.total_amount).toLocaleString()}</Text>
      </View>
      
      {item.items && item.items.length > 0 && (
        <View style={styles.itemsList}>
          {item.items.map((saleItem, index) => (
            <View key={index} style={styles.saleItemDetail}>
              <Text style={styles.itemName}>{saleItem.product_name}</Text>
              <Text style={styles.itemQuantity}>
                {saleItem.quantity} × ₦{saleItem.unit_price}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {item.customer_phone && (
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color="#64748b" />
          <Text style={styles.customerPhone}>{item.customer_phone}</Text>
        </View>
      )}
    </View>
  );

  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Sales History</Text>
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {sales.length} sales • ₦{getTotalRevenue().toLocaleString()} total
          </Text>
        </View>
      </View>

      {sales.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No sales yet</Text>
          <Text style={styles.emptySubtitle}>Sales will appear here once you start making transactions</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={SaleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
  },
  saleItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  saleDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginBottom: 8,
  },
  saleItemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748b',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});