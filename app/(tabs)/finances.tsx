import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const ExpenseTracker = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    paymentMethod: 'card',
    description: '',
    date: new Date(),
    type: 'expense'
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Categories and payment methods
  const categories = [
    'Food', 'Transport', 'Shopping', 'Entertainment',
    'Bills', 'Healthcare', 'Education', 'Travel',
    'Gifts', 'Salary', 'Freelance', 'Investments'
  ];

  const paymentMethods = ['card', 'cash', 'bank transfer'];
  const transactionTypes = ['expense', 'income'];

  // Get current user
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  };

  // Fetch transactions from Supabase for current user
  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Convert date strings to Date objects and amount to number
      const formattedData = data.map(t => ({
        ...t,
        date: new Date(t.date),
        amount: parseFloat(t.amount)
      }));
      
      setTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Calculate totals
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const groupedTransactionsArray = Object.keys(groupedTransactions).map(date => ({
    date,
    transactions: groupedTransactions[date]
  }));

  // Sort by date (newest first)
  groupedTransactionsArray.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Handle adding new transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Insert new transaction to Supabase with user_id
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          type: newTransaction.type,
          amount: amount.toString(),
          category: newTransaction.category,
          payment_method: newTransaction.paymentMethod,
          description: newTransaction.description,
          date: new Date().toISOString(),
          user_id: currentUser.id
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Add the new transaction to local state
        const addedTransaction = {
          ...data[0],
          date: new Date(data[0].date),
          amount: parseFloat(data[0].amount)
        };
        
        setTransactions([addedTransaction, ...transactions]);
        setModalVisible(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewTransaction({
      amount: '',
      category: '',
      paymentMethod: 'card',
      description: '',
      date: new Date(),
      type: 'expense'
    });
  };

  // Render transaction item
  const renderTransactionItem = ({ item }) => (
    <View style={[
      styles.transactionItem,
      item.type === 'income' ? styles.incomeItem : styles.expenseItem
    ]}>
      <View style={styles.transactionIcon}>
        {item.type === 'income' ? (
          <FontAwesome name="money" size={20} color="#2ecc71" />
        ) : (
          <FontAwesome name="shopping-cart" size={20} color="#e74c3c" />
        )}
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionMethod}>{item.payment_method}</Text>
        {item.description && <Text style={styles.transactionDescription}>{item.description}</Text>}
      </View>
      <Text style={[
        styles.transactionAmount,
        item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
      ]}>
        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
    </View>
  );

  // Render day section
  const renderDaySection = ({ item }) => (
    <View style={styles.daySection}>
      <Text style={styles.dayHeader}>
        {new Date(item.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}
      </Text>
      <FlatList
        data={item.transactions}
        renderItem={renderTransactionItem}
        keyExtractor={t => t.id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Money Manager</Text>
        <Text style={styles.headerSubtitle}>Track your finances</Text>
        
        {/* Balance Overview */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[
            styles.balanceAmount,
            balance >= 0 ? styles.positiveBalance : styles.negativeBalance
          ]}>
            ${Math.abs(balance).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.incomeText}>${totalIncome.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.expenseText}>${totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'records' && styles.activeTab]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView 
        style={styles.transactionList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTransactions}
          />
        }
      >
        {refreshing && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a76a8" />
          </View>
        ) : groupedTransactionsArray.length > 0 ? (
          <FlatList
            data={groupedTransactionsArray}
            renderItem={renderDaySection}
            keyExtractor={item => item.date}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Button - Now positioned above bottom tabs */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to add transactions');
          } else {
            setModalVisible(true);
          }
        }}
        disabled={loading}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!loading) {
            setModalVisible(false);
            resetForm();
          }
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity 
                onPress={() => {
                  if (!loading) {
                    setModalVisible(false);
                    resetForm();
                  }
                }}
                disabled={loading}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Transaction Type Toggle */}
            <View style={styles.typeToggleContainer}>
              {transactionTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeToggleButton,
                    newTransaction.type === type && styles.activeTypeToggle
                  ]}
                  onPress={() => setNewTransaction({...newTransaction, type})}
                >
                  <Text style={[
                    styles.typeToggleText,
                    newTransaction.type === type && styles.activeTypeToggleText
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newTransaction.amount}
              onChangeText={text => setNewTransaction({...newTransaction, amount: text})}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <View style={styles.categoryContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryPill,
                      newTransaction.category === category && styles.selectedCategory
                    ]}
                    onPress={() => setNewTransaction({...newTransaction, category})}
                  >
                    <Text style={[
                      styles.categoryText,
                      newTransaction.category === category && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    newTransaction.paymentMethod === method && styles.selectedMethod
                  ]}
                  onPress={() => setNewTransaction({...newTransaction, paymentMethod: method})}
                >
                  <Text style={[
                    styles.methodText,
                    newTransaction.paymentMethod === method && styles.selectedMethodText
                  ]}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              value={newTransaction.description}
              onChangeText={text => setNewTransaction({...newTransaction, description: text})}
              multiline
            />

            <TouchableOpacity 
              style={[
                styles.saveButton,
                loading && styles.saveButtonDisabled
              ]}
              onPress={handleAddTransaction}
              disabled={loading || !newTransaction.amount || !newTransaction.category}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {newTransaction.type === 'income' ? 'Add Income' : 'Add Expense'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Update the styles to match the HomeScreen color scheme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29', // Dark blue from gradient
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#302b63', // Middle gradient color
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)', // Matching subtitle opacity
  },
  balanceContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#6C63FF', // Purple accent from HomeScreen
  },
  negativeBalance: {
    color: '#FF6B6B', // Soft red that fits the scheme
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent white
    borderRadius: 12,
    padding: 15,
    width: '48%',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  incomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF', // Purple accent
  },
  expenseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)', // Lighter border
    marginHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6C63FF', // Purple accent
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  transactionList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 5,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  transactionItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF', // Purple accent
  },
  expenseItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 3,
  },
  transactionMethod: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 3,
  },
  transactionDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#6C63FF',
  },
  expenseAmount: {
    color: '#FF6B6B',
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF', // Purple accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#24243e', // Darkest gradient color
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  typeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
    overflow: 'hidden',
  },
  typeToggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTypeToggle: {
    backgroundColor: '#6C63FF', // Purple accent
  },
  typeToggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  activeTypeToggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryScroll: {
    marginBottom: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#6C63FF', // Purple accent
  },
  categoryText: {
    color: 'white',
  },
  selectedCategoryText: {
    color: 'white',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  methodButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
  },
  selectedMethod: {
    backgroundColor: '#6C63FF', // Purple accent
  },
  methodText: {
    color: 'white',
  },
  selectedMethodText: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#6C63FF', // Purple accent
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ExpenseTracker;