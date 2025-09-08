import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { offlineStorage } from '../services/offlineStorage';

export default function AddCustomerScreen({ navigation }) {
  const { theme } = useTheme();
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: '50000'
  });

  const handleSave = async () => {
    if (!customer.name || !customer.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      ...customer,
      creditLimit: parseFloat(customer.creditLimit) || 0,
      points: 0,
      credit: 0,
      createdAt: new Date().toISOString()
    };

    await offlineStorage.saveCustomer(newCustomer);
    Alert.alert('Success', 'Customer added successfully');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Add Customer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Customer Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Enter customer name"
            placeholderTextColor={theme.textTertiary}
            value={customer.name}
            onChangeText={(text) => setCustomer({ ...customer, name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Enter phone number"
            placeholderTextColor={theme.textTertiary}
            value={customer.phone}
            onChangeText={(text) => setCustomer({ ...customer, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Enter address"
            placeholderTextColor={theme.textTertiary}
            value={customer.address}
            onChangeText={(text) => setCustomer({ ...customer, address: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Credit Limit</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="50000"
            placeholderTextColor={theme.textTertiary}
            value={customer.creditLimit}
            onChangeText={(text) => setCustomer({ ...customer, creditLimit: text })}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.success }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Customer</Text>
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
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});