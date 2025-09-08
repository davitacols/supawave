import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function WhatsAppScreen({ navigation }) {
  const { theme } = useTheme();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const connectWhatsApp = () => {
    if (whatsappNumber) {
      setIsConnected(true);
    }
  };

  const sendTestMessage = () => {
    const message = "🛒 *SupaWave Store* - Your order has been received!\n\nThank you for shopping with us.";
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const features = [
    { icon: 'chatbubble-outline', title: 'Customer Ordering', desc: 'Customers order via WhatsApp' },
    { icon: 'receipt-outline', title: 'Instant Receipts', desc: 'Send receipts to customer phones' },
    { icon: 'notifications-outline', title: 'Stock Alerts', desc: 'Get low stock notifications' },
    { icon: 'headset-outline', title: 'Customer Support', desc: 'Built-in support system' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>WhatsApp Integration</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {!isConnected ? (
          <View style={[styles.setupCard, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="logo-whatsapp" size={48} color="#25D366" style={styles.whatsappIcon} />
            <Text style={[styles.setupTitle, { color: theme.text }]}>Connect WhatsApp Business</Text>
            <Text style={[styles.setupDesc, { color: theme.textSecondary }]}>
              Enter your WhatsApp Business number to enable customer communication
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="+234XXXXXXXXXX"
              placeholderTextColor={theme.textTertiary}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: '#25D366' }]}
              onPress={connectWhatsApp}
            >
              <Text style={styles.connectButtonText}>Connect WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectedContent}>
            <View style={[styles.statusCard, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#25D366" />
                <Text style={[styles.statusText, { color: theme.text }]}>Connected: {whatsappNumber}</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: '#25D366' }]}
                onPress={sendTestMessage}
              >
                <Ionicons name="send" size={16} color="white" />
                <Text style={styles.testButtonText}>Send Test Message</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.featuresCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.featuresTitle, { color: theme.text }]}>Available Features</Text>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name={feature.icon} size={20} color="#25D366" />
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
    padding: 20,
  },
  setupCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  whatsappIcon: {
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  setupDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  connectButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedContent: {
    gap: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresCard: {
    padding: 20,
    borderRadius: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 14,
    marginTop: 2,
  },
});