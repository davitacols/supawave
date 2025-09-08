import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { salesAPI, inventoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Logo from '../components/Logo';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [stats, setStats] = useState({});
  const [lowStock, setLowStock] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analytics, lowStockData, salesData] = await Promise.all([
        salesAPI.getAnalytics(),
        inventoryAPI.getLowStock(),
        salesAPI.getSales()
      ]);
      
      console.log('Analytics:', analytics);
      console.log('Sales data:', salesData);
      
      // Calculate today's sales
      const today = new Date().toDateString();
      const todaySales = (salesData.results || salesData || []).filter(sale => 
        new Date(sale.created_at).toDateString() === today
      );
      
      const todayRevenue = todaySales.reduce((sum, sale) => 
        sum + parseFloat(sale.total_amount || 0), 0
      );
      
      setStats({
        ...analytics,
        today_revenue: todayRevenue,
        today_sales: todaySales.length
      });
      setLowStock(lowStockData.results || lowStockData || []);
      setRecentSales((salesData.results || salesData || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, change, isPositive }) => (
    <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: isDark ? theme.border : '#f1f5f9' }]}>
          <Ionicons name={icon} size={20} color={theme.textSecondary} />
        </View>
        <View style={[styles.changeIndicator, { backgroundColor: isPositive ? (isDark ? '#064e3b' : '#dcfce7') : (isDark ? '#7f1d1d' : '#fef2f2') }]}>
          <Ionicons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={isPositive ? theme.success : theme.danger} 
          />
          <Text style={[styles.changeText, { color: isPositive ? theme.success : theme.danger }]}>
            {change}
          </Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );

  const QuickActionCard = ({ title, icon, onPress }) => (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={onPress}>
      <View style={[styles.actionIconContainer, { backgroundColor: isDark ? theme.border : '#eff6ff' }]}>
        <Ionicons name={icon} size={24} color={theme.primary} />
      </View>
      <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
    </TouchableOpacity>
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Logo size="small" theme={theme} />
            <Text style={[styles.userName, { color: theme.textSecondary }]}>Welcome, {user?.first_name || user?.username}</Text>
            <Text style={[styles.dateText, { color: theme.textTertiary }]}>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={[styles.logoutButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Today's Revenue"
          value={`₦${(stats.today_revenue || 0).toLocaleString()}`}
          icon="trending-up-outline"
          change="+12%"
          isPositive={true}
        />
        <StatCard
          title="Today's Sales"
          value={stats.today_sales || 0}
          icon="receipt-outline"
          change="+8%"
          isPositive={true}
        />
        <StatCard
          title="Monthly Revenue"
          value={`₦${(stats.monthly_revenue || 0).toLocaleString()}`}
          icon="bar-chart-outline"
          change="+15%"
          isPositive={true}
        />
        <StatCard
          title="Monthly Sales"
          value={stats.monthly_sales_count || 0}
          icon="analytics-outline"
          change="+5%"
          isPositive={true}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionList}>
          <QuickActionCard
            title="Process New Sale"
            icon="card-outline"
            onPress={() => navigation.navigate('POS')}
          />
          <QuickActionCard
            title="WhatsApp Setup"
            icon="logo-whatsapp"
            onPress={() => navigation.navigate('WhatsApp')}
          />
          <QuickActionCard
            title="Add Product"
            icon="add-circle-outline"
            onPress={() => navigation.navigate('AddProduct')}
          />
          <QuickActionCard
            title="Low Stock Alert"
            icon="warning-outline"
            onPress={() => navigation.navigate('LowStock')}
          />
        </View>
      </View>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Sales</Text>
          {recentSales.map((sale, index) => (
            <View key={index} style={[styles.saleItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.saleInfo}>
                <Text style={[styles.saleAmount, { color: theme.success }]}>₦{parseFloat(sale.total_amount).toLocaleString()}</Text>
                <Text style={[styles.saleTime, { color: theme.textSecondary }]}>{formatTime(sale.created_at)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          ))}
        </View>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <View style={styles.section}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={[styles.alertTitle, { color: theme.text }]}>Low Stock Alert</Text>
          </View>
          {lowStock.slice(0, 3).map((item, index) => (
            <View key={index} style={[styles.lowStockItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.stockCount, { color: theme.warning }]}>{item.stock_quantity} left</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userName: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statsGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    minHeight: 24,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionList: {
    gap: 8,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  saleItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saleInfo: {
    flex: 1,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  saleTime: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  lowStockItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  stockCount: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
});