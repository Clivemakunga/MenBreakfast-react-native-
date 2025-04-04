import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Image, 
  Text, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInLeft } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    type: 'conference'
  });

  const showDatepicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Handle Android dismissal
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      
      if (event.type === 'dismissed') {
        return;
      }
    }

    if (selectedDate) {
      if (Platform.OS === 'android') {
        if (pickerMode === 'date') {
          // User selected a date, now show time picker
          const newDate = new Date(selectedDate);
          // Keep the existing time
          newDate.setHours(newEvent.date.getHours());
          newDate.setMinutes(newEvent.date.getMinutes());
          setNewEvent(prev => ({ ...prev, date: newDate }));
          // Show time picker next
          setTimeout(() => showDatepicker('time'), 100);
          return;
        } else {
          // User selected a time
          const newDate = new Date(newEvent.date);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setNewEvent(prev => ({ ...prev, date: newDate }));
        }
      } else {
        // iOS handles both at once
        setNewEvent(prev => ({ ...prev, date: selectedDate }));
      }
    }

    // iOS automatically closes the picker
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  // Fetch all data from Supabase
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
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

      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) throw eventsError;
      setEvents(Array(eventsCount || 0).fill({}));

      const { count: userCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      setUserCount(userCount || 0);

      const { count: approvalsCount, error: approvalsError } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (approvalsError) throw approvalsError;
      setPendingApprovals(approvalsCount || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchData();
    
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

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedEvents = data.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const createEvent = async () => {
    setError(null);
    setIsCreating(true);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date.toISOString(),
          location: newEvent.location,
          image_url: newEvent.image_url,
          type: newEvent.type
        }])
        .select();
      
      if (supabaseError) throw supabaseError;
      
      if (data) {
        await fetchEvents();
        setNewEvent({
          title: '',
          description: '',
          date: new Date(),
          location: '',
          image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
          type: 'conference'
        });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Network request failed. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

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

      {/* Event Management Buttons */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push('/rsvps')}
        >
          <MaterialIcons name="list" size={24} color="white" />
          <Text style={styles.buttonText}>View RSVPs</Text>
        </TouchableOpacity>
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

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create New Event</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Title</Text>
            <TextInput
              style={styles.input}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              placeholder="Tech Conference 2023"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              placeholder="Describe your event..."
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date & Time</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => showDatepicker('date')}
            >
              <Text>Date: {newEvent.date.toLocaleDateString()}</Text>
              <TouchableOpacity 
                onPress={() => showDatepicker('time')}
                style={{ marginTop: 8 }}
              >
                <Text>Time: {newEvent.date.toLocaleTimeString()}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newEvent.date}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={newEvent.location}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
              placeholder="San Francisco, CA or Online"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={newEvent.image_url}
              onChangeText={(text) => setNewEvent({ ...newEvent, image_url: text })}
              placeholder="https://example.com/image.jpg"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCreateModal(false)}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.createButton, isCreating && styles.disabledButton]}
              onPress={createEvent}
              disabled={isCreating || !newEvent.title || !newEvent.location}
            >
              {isCreating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
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
    marginTop: 10
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  modalContainer: {
    flexGrow: 1,
    padding: 20,
    marginTop: 10
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
});