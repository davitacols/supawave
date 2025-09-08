import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { inventoryAPI, salesAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useOffline } from '../context/OfflineContext';
import { offlineStorage } from '../services/offlineStorage';

export default function POSScreen() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [barcodeText, setBarcodeText] = useState('');
  const { theme } = useTheme();
  const { isOnline, saveOfflineSale } = useOffline();

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await offlineStorage.getCustomers();
    setCustomers(data);
  };

  const loadProducts = async () => {
    try {
      let data;
      if (isOnline) {
        data = await inventoryAPI.getProducts();
        // Save to offline storage
        await offlineStorage.saveProducts(data.results || data);
      } else {
        // Load from offline storage
        data = await offlineStorage.getProducts();
      }
      setProducts(data.results || data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Try offline storage as fallback
      const offlineData = await offlineStorage.getProducts();
      setProducts(offlineData);
    }
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      Alert.alert('Out of Stock', `${product.name} is out of stock`);
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity >= product.stock_quantity) {
      Alert.alert('Insufficient Stock', `Only ${product.stock_quantity} units available`);
      return;
    }
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      Alert.alert('Insufficient Stock', `Only ${product.stock_quantity} units available`);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCart([]) }
      ]
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  };







  const handleBarcodeInput = (barcode) => {
    const product = products.find(p => p.sku === barcode);
    if (product) {
      addToCart(product);
      setSearch('');
    } else {
      Alert.alert('Product Not Found', 'No product found with this SKU');
    }
  };

  const printReceipt = () => {
    const receipt = `
SupaWave Receipt
================
${cart.map(item => `${item.name} x${item.quantity} - ₦${(item.selling_price * item.quantity).toLocaleString()}`).join('\n')}
================
Total: ₦${getTotal().toLocaleString()}

Thank you!
`;
    
    Alert.alert('Receipt', receipt);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        total_amount: getTotal().toString(),
        items: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          unit_price: item.selling_price.toString()
        }))
      };

      let result;
      if (isOnline) {
        result = await salesAPI.createSale(saleData);
      } else {
        result = await saveOfflineSale(saleData);
      }
      
      printReceipt();
      setCart([]);
      setShowCart(false);
      
      const message = isOnline ? 'Sale completed!' : 'Sale saved offline!';
      Alert.alert('Success', `${message} Total: ₦${getTotal().toLocaleString()}`);
      
      loadProducts();
    } catch (error) {
      console.error('Sale error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const ProductItem = ({ item }) => {
    const isOutOfStock = item.stock_quantity <= 0;
    const isLowStock = item.stock_quantity <= 10 && item.stock_quantity > 0;
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }, isOutOfStock && styles.outOfStock]} 
        onPress={() => addToCart(item)}
        disabled={isOutOfStock}
      >
        <View style={styles.productHeader}>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
          <Ionicons 
            name={isOutOfStock ? "close-circle" : "add-circle"} 
            size={28} 
            color={isOutOfStock ? "#ef4444" : "#10b981"} 
          />
        </View>
        <Text style={[styles.productPrice, { color: theme.success }]}>₦{item.selling_price}</Text>
        <View style={styles.stockInfo}>
          <Text style={[
            styles.productStock,
            { color: theme.textSecondary },
            isOutOfStock && styles.outOfStockText,
            isLowStock && styles.lowStockText
          ]}>
            {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${item.stock_quantity})` : `Stock: ${item.stock_quantity}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const CartItem = ({ item }) => {
    const itemTotal = item.selling_price * item.quantity;
    const maxQuantity = item.stock_quantity;
    
    return (
      <View style={styles.cartItem}>
        <View style={styles.cartItemLeft}>
          <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cartPrice}>₦{item.selling_price} each</Text>
          <Text style={styles.cartTotal}>₦{itemTotal.toLocaleString()}</Text>
        </View>
        <View style={[styles.cartControls, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={item.quantity <= 1 ? "#cbd5e1" : "#ef4444"} />
          </TouchableOpacity>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantity, { color: theme.text }]}>{item.quantity}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.quantityButton, item.quantity >= maxQuantity && styles.disabledButton]}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= maxQuantity}
          >
            <Ionicons name="add" size={20} color={item.quantity >= maxQuantity ? "#cbd5e1" : "#10b981"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Point of Sale</Text>
        {selectedCustomer && (
          <View style={styles.customerBadge}>
            <Text style={[styles.customerName, { color: theme.primary }]}>{selectedCustomer.name}</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <Ionicons name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
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
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setShowBarcodeInput(true)}
        >
          <Ionicons name="barcode-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.customerButton, { backgroundColor: selectedCustomer ? theme.success : theme.primary }]}
          onPress={() => {
            Alert.prompt('Customer Phone', 'Enter customer phone number:', (phone) => {
              const customer = customers.find(c => c.phone === phone);
              if (customer) {
                setSelectedCustomer(customer);
              } else {
                Alert.alert('Not Found', 'Customer not found');
              }
            });
          }}
        >
          <Ionicons name="person" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredProducts}
          renderItem={ProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFloatingButton} onPress={() => setShowCart(true)}>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
          <Ionicons name="cart" size={24} color="white" />
          <Text style={styles.cartButtonText}>₦{getTotal().toLocaleString()}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      {showCart && (
        <View style={styles.cartModal}>
          <View style={[styles.cartModalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text }]}>Cart ({cart.length} items)</Text>
              <View style={styles.cartHeaderButtons}>
                <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.clearButtonText, { color: theme.danger }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={cart}
              renderItem={CartItem}
              keyExtractor={item => item.id}
              style={styles.cartList}
            />
            
            <View style={styles.cartFooter}>
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>₦{getTotal().toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tax (0%):</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>₦0</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                  <Text style={[styles.totalAmount, { color: theme.success }]}>₦{getTotal().toLocaleString()}</Text>
                </View>
              </View>
              
              <View style={styles.checkoutSection}>
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: theme.background }]}
                  onPress={() => setShowCart(false)}
                >
                  <Text style={[styles.continueButtonText, { color: theme.textSecondary }]}>Continue Shopping</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkoutButton, { backgroundColor: theme.success }, loading && styles.buttonDisabled]}
                  onPress={processSale}
                  disabled={loading || cart.length === 0}
                >
                  <Ionicons name="card" size={20} color="white" />
                  <Text style={styles.checkoutText}>
                    {loading ? 'Processing...' : 'Complete Sale'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Barcode Input Modal */}
      {showBarcodeInput && (
        <View style={styles.barcodeModal}>
          <View style={[styles.barcodeContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.barcodeTitle, { color: theme.text }]}>Enter Product SKU</Text>
            <TextInput
              style={[styles.barcodeInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Enter SKU or barcode"
              placeholderTextColor={theme.textTertiary}
              value={barcodeText}
              onChangeText={setBarcodeText}
              autoFocus
            />
            <View style={styles.barcodeButtons}>
              <TouchableOpacity
                style={[styles.barcodeButton, { backgroundColor: theme.textSecondary }]}
                onPress={() => {
                  setShowBarcodeInput(false);
                  setBarcodeText('');
                }}
              >
                <Text style={styles.barcodeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.barcodeButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (barcodeText) {
                    const product = products.find(p => p.sku === barcodeText);
                    if (product) {
                      addToCart(product);
                    } else {
                      Alert.alert('Not Found', 'Product with this SKU not found');
                    }
                  }
                  setShowBarcodeInput(false);
                  setBarcodeText('');
                }}
              >
                <Text style={styles.barcodeButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  productsList: {
    padding: 16,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stockInfo: {
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#64748b',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cartItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  cartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cartPrice: {
    fontSize: 14,
    color: '#64748b',
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 2,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginRight: 8,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  cartHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  checkoutSection: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  outOfStock: {
    opacity: 0.5,
    backgroundColor: '#fef2f2',
  },
  outOfStockText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  lowStockText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  cartFloatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cartModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  scanButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  barcodeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeContainer: {
    width: '80%',
    padding: 24,
    borderRadius: 12,
  },
  barcodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  barcodeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  barcodeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  barcodeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  barcodeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  customerButton: {
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
  },
});