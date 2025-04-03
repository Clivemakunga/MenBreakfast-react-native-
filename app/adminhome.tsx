import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, Image, Text } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInLeft } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

type AdminProfile = {
  surname: string;
  name: string;
  admin: any;
  id: string;
  email: string;
  image: string;
  created_at: string;
  last_sign_in_at: string;
};

export default function AdminHome() {
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Fetch all data from Supabase
  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Get current admin user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch admin profile details
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        setAdminProfile({
          id: user.id,
          email: user.email || '',
          name: profileData.name || '',
          surname: profileData.surname || '',
          image: profileData.image || 'https://randomuser.me/api/portraits/men/1.jpg',
          admin: profileData.admin || false,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || ''
        });
      }

      // Fetch events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) throw eventsError;
      setEvents(Array(eventsCount || 0).fill({}));

      // Fetch user count
      const { count: userCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      setUserCount(userCount || 0);

      // Fetch pending approvals
      const { count: approvalsCount, error: approvalsError } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (approvalsError) throw approvalsError;
      setPendingApprovals(approvalsCount || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for changes
    const subscription = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={fetchData}
          tintColor="#FFFFFF"
        />
      }
    >
      {/* Admin Profile Section */}
      {adminProfile && (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: adminProfile.image }} 
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {adminProfile.name} {adminProfile.surname}
              </Text>
              <Text style={styles.profileRole}>
                {adminProfile.admin ? 'Admin' : 'Moderator'}
              </Text>
              <Text style={styles.profileEmail}>{adminProfile.email}</Text>
            </View>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{events.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userCount}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>--</Text>
              <Text style={styles.statLabel}>Blogs</Text>
            </View>
          </View>
          
          <View style={styles.profileMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="date-range" size={16} color="#666" />
              <Text style={styles.metaText}>
                Joined {formatDate(adminProfile.created_at)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.metaText}>
                Last active {formatDate(adminProfile.last_sign_in_at)}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Admin Header */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <Text style={[styles.headerTitle, styles.titleText]}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Event & Financial Management</Text>
        
        {pendingApprovals > 0 && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.alertBanner}>
            <MaterialIcons name="warning" size={20} color="#FF9800" />
            <Text style={styles.alertText}>
              {pendingApprovals} items pending approval
            </Text>
            <TouchableOpacity onPress={() => router.push('/admin/approvals')}>
              <Text style={styles.alertAction}>Review</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Quick Actions Grid */}
      <Animated.View entering={SlideInLeft.delay(400)} style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/manageusers')}
        >
          <MaterialIcons name="people" size={30} color="#4CAF50" />
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/manageevents')}
        >
          <MaterialIcons name="event" size={30} color="#2196F3" />
          <Text style={styles.actionText}>Manage Events</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/videoupload')}
        >
          <FontAwesome name="line-chart" size={30} color="#9C27B0" />
          <Text style={styles.actionText}>Upload Videos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/createblogs')}
        >
          <MaterialIcons name="attach-money" size={30} color="#FF5722" />
          <Text style={styles.actionText}>Create Invest Blogs</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 40
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  profileRole: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  profileMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  header: {
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  titleText: {
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    color: '#000',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  alertText: {
    flex: 1,
    marginLeft: 10,
    color: '#FF9800',
  },
  alertAction: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});