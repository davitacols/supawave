import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { salesAPI } from '../services/api';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const [reports, setReports] = useState({
    today: { sales: 0, revenue: 0 },
    week: { sales: 0, revenue: 0 },
    month: { sales: 0, revenue: 0 },
    topProducts: []
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [analytics, salesData] = await Promise.all([
        salesAPI.getAnalytics(),
        salesAPI.getSales()
      ]);
      
      console.log('Analytics:', analytics);
      console.log('Sales data:', salesData);
      
      // Calculate today's data
      const today = new Date().toDateString();
      const todaySales = (salesData.results || salesData || []).filter(sale => 
        new Date(sale.created_at).toDateString() === today
      );
      const todayRevenue = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
      
      setReports({
        today: { sales: todaySales.length, revenue: todayRevenue },
        week: { sales: analytics.weekly_sales_count || 0, revenue: analytics.weekly_revenue || 0 },
        month: { sales: analytics.monthly_sales_count || 0, revenue: analytics.monthly_revenue || 0 },
        topProducts: analytics.top_products || []
      });
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const ReportCard = ({ title, sales = 0, revenue = 0, icon, color }) => (
    <View style={[styles.reportCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.salesCount, { color: theme.textSecondary }]}>{sales} sales</Text>
      <Text style={[styles.revenue, { color: theme.success }]}>₦{revenue.toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Reports & Analytics</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sales Overview</Text>
          <View style={styles.reportGrid}>
            <ReportCard
              title="Today"
              sales={reports.today?.sales || 0}
              revenue={reports.today?.revenue || 0}
              icon="today-outline"
              color="#3b82f6"
            />
            <ReportCard
              title="This Week"
              sales={reports.week?.sales || 0}
              revenue={reports.week?.revenue || 0}
              icon="calendar-outline"
              color="#10b981"
            />
            <ReportCard
              title="This Month"
              sales={reports.month?.sales || 0}
              revenue={reports.month?.revenue || 0}
              icon="bar-chart-outline"
              color="#8b5cf6"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Selling Products</Text>
          {(reports.topProducts || []).map((product, index) => (
            <View key={index} style={[styles.productItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.productRank}>
                <Text style={[styles.rankNumber, { color: theme.primary }]}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                <Text style={[styles.productSales, { color: theme.textSecondary }]}>{product.sales_count || 0} sold</Text>
              </View>
              <Text style={[styles.productRevenue, { color: theme.success }]}>₦{(product.revenue || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reportGrid: {
    gap: 12,
  },
  reportCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  salesCount: {
    fontSize: 14,
    marginBottom: 4,
  },
  revenue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productSales: {
    fontSize: 14,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});