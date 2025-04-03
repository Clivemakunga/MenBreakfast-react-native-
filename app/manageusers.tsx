import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  RefreshControl,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type User = {
  name: string;
  id: string;
  email: string;
  surname: string;
  image: string;
  admin: boolean;
  created_at: string;
};

const ManageUsersScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, image, admin, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get admin count
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('admin', true);

      if (countError) throw countError;

      setUsers(usersData || []);
      setAdminCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`admin-${userId}`]: true }));

      if (!currentStatus && adminCount >= 5) {
        Alert.alert('Limit Reached', 'Maximum of 5 admins allowed');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, admin: !currentStatus } : user
      ));

      setAdminCount(prev => currentStatus ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error updating admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`admin-${userId}`]: false }));
    }
  };

  const renderUserItem = ({ item, index }: { item: User, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      style={styles.userCard}
    >
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.image || 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, styles.subtitleText]}>
            {item.name || 'No name'}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userDate}>
            Joined: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.id !== currentUserId && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.admin ? styles.adminButtonActive : styles.adminButtonInactive,
              loadingActions[`admin-${item.id}`] ? styles.buttonLoading : null
            ]}
            onPress={() => toggleAdminStatus(item.id, item.admin)}
            disabled={loadingActions[`admin-${item.id}`]}
          >
            <MaterialIcons 
              name={item.admin ? 'star' : 'star-outline'} 
              size={20} 
              color={item.admin ? 'gold' : 'white'} 
            />
            <Text style={styles.actionButtonText}>
              {item.admin ? 'Admin' : 'Make Admin'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchUsers}
          tintColor="#FFFFFF"
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={[styles.title, styles.titleText]}>Manage Users</Text>
        <Text style={styles.subtitle}>
          {users.length} total users • {adminCount} admins
        </Text>
      </Animated.View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="users" size={48} color="gray" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    color: '#000',
  },
  titleText: {
    color: '#000',
  },
  subtitleText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: 'gray',
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
    color: '#000',
  },
  userDate: {
    fontSize: 12,
    opacity: 0.6,
    color: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  adminButtonInactive: {
    backgroundColor: '#2196F3',
  },
  adminButtonActive: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonLoading: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ManageUsersScreen;