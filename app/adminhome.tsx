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
  Platform,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInLeft } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as VideoPicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import CustomDropdown from '@/components/CustomDropdown';

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

type MediaType = 'book' | 'movie';

export default function AdminHome() {
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [showThoughtModal, setShowThoughtModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Form states
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    image_url: '',
    type: 'conference'
  });

  const [motivationData, setMotivationData] = useState({
    topic: '',
    description: '',
    video_url: '',
    active: true
  });

  const [thoughtData, setThoughtData] = useState({
    topic: '',
    content: '',
    video_url: '',
    active: true
  });

  const [mediaData, setMediaData] = useState({
    title: '',
    type: 'book' as MediaType,
    category: '',
    image_url: '',
    description: '',
    link: ''
  });

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

    return () => supabase.removeChannel(subscription);
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickVideo = async () => {
    let result = await VideoPicker.launchImageLibraryAsync({
      mediaTypes: VideoPicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0].uri);
    }
  };

  const showDatepicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') return;
    }

    if (selectedDate) {
      if (Platform.OS === 'android' && pickerMode === 'date') {
        const newDate = new Date(selectedDate);
        newDate.setHours(newEvent.date.getHours());
        newDate.setMinutes(newEvent.date.getMinutes());
        setNewEvent(prev => ({ ...prev, date: newDate }));
        setTimeout(() => showDatepicker('time'), 100);
        return;
      } else if (Platform.OS === 'android') {
        const newDate = new Date(newEvent.date);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setNewEvent(prev => ({ ...prev, date: newDate }));
      } else {
        setNewEvent(prev => ({ ...prev, date: selectedDate }));
      }
    }

    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  const uploadFile = async (uri: string, bucket: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileExt = uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      formData.append('file', {
        uri,
        name: fileName,
        type: uri.includes('image') ? `image/${fileExt}` : `video/${fileExt}`,
      } as any);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, formData);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const createMondayMotivation = async () => {
    setIsCreating(true);
    setError(null);

    try {
      let videoUrl = '';
      if (selectedVideo) {
        videoUrl = await uploadFile(selectedVideo, 'motivation-videos');
      }

      const { data, error } = await supabase
        .from('monday_motivations')
        .insert([{
          ...motivationData,
          video_url: videoUrl,
          created_by: adminProfile?.id
        }])
        .select();

      if (error) throw error;

      setMotivationData({
        topic: '',
        description: '',
        video_url: '',
        active: true
      });
      setSelectedVideo(null);
      setShowMotivationModal(false);
    } catch (error) {
      console.error('Error creating motivation:', error);
      setError(error.message || 'Failed to create motivation');
    } finally {
      setIsCreating(false);
    }
  };

  const createThoughtOfTheDay = async () => {
    setIsCreating(true);
    setError(null);

    try {
      if (!selectedVideo) {
        Alert.alert('Video Required', 'Please select a video for the Thought of the Day');
        return;
      }

      const videoUrl = await uploadFile(selectedVideo, 'thought-videos');

      const { data, error } = await supabase
        .from('thoughts_of_day')
        .insert([{
          ...thoughtData,
          video_url: videoUrl,
          created_by: adminProfile?.id
        }])
        .select();

      if (error) throw error;

      setThoughtData({
        topic: '',
        content: '',
        video_url: '',
        active: true
      });
      setSelectedVideo(null);
      setShowThoughtModal(false);
    } catch (error) {
      console.error('Error creating thought:', error);
      Alert.alert('Error', error.message || 'Failed to create thought');
    } finally {
      setIsCreating(false);
    }
  };

  const createRecommendedMedia = async () => {
    setIsCreating(true);
    setError(null);

    try {
      if (!selectedImage) throw new Error('Please select an image');

      const imageUrl = await uploadFile(selectedImage, 'media-images');

      const { data, error } = await supabase
        .from('recommended_media')
        .insert([{
          ...mediaData,
          image_url: imageUrl,
          created_by: adminProfile?.id
        }])
        .select();

      if (error) throw error;

      setMediaData({
        title: '',
        type: 'book',
        category: '',
        image_url: '',
        description: '',
        link: ''
      });
      setSelectedImage(null);
      setShowMediaModal(false);
    } catch (error) {
      console.error('Error creating media:', error);
      setError(error.message || 'Failed to create media');
    } finally {
      setIsCreating(false);
    }
  };

  const createEvent = async () => {
    setError(null);
    setIsCreating(true);

    try {
      if (!selectedImage) throw new Error('Please select an image for the event');

      const imageUrl = await uploadFile(selectedImage, 'event-images');

      const { data, error: supabaseError } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date.toISOString(),
          location: newEvent.location,
          image_url: imageUrl,
          type: newEvent.type
        }])
        .select();

      if (supabaseError) throw supabaseError;

      if (data) {
        setNewEvent({
          title: '',
          description: '',
          date: new Date(),
          location: '',
          image_url: '',
          type: 'conference'
        });
        setSelectedImage(null);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event');
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
              <Text style={styles.statNumber}>{pendingApprovals}</Text>
              <Text style={styles.statLabel}>Approvals</Text>
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

      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <Text style={[styles.headerTitle, styles.titleText]}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Content & Event Management</Text>

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

      <Animated.View entering={SlideInLeft.delay(400)} style={styles.quickActions}>
        {/* Row 1 */}
        <View style={styles.cardRow}>
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
        </View>

        {/* Row 2 */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/videoupload')}
          >
            <FontAwesome name="video-camera" size={30} color="#9C27B0" />
            <Text style={styles.actionText}>Upload Videos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/createblogs')}
          >
            <MaterialIcons name="library-books" size={30} color="#FF5722" />
            <Text style={styles.actionText}>Create Blogs</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowMotivationModal(true)}
          >
            <Ionicons name="sunny" size={30} color="#FFD700" />
            <Text style={styles.actionText}>Monday Motivation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowThoughtModal(true)}
          >
            <Ionicons name="bulb" size={30} color="#4CAF50" />
            <Text style={styles.actionText}>Thought of Day</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 */}
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowMediaModal(true)}
          >
            <Ionicons name="book" size={30} color="#2196F3" />
            <Text style={styles.actionText}>Recommended Media</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/financialtools')}
          >
            <MaterialIcons name="attach-money" size={30} color="#9C27B0" />
            <Text style={styles.actionText}>Financial Tools</Text>
          </TouchableOpacity>
        </View>
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
              placeholder="Tech Conference 2025"
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
              placeholder="Bulawayo, Zimbabwe"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Image</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.uploadContent}>
                  <MaterialIcons name="add-a-photo" size={24} color="#666" />
                  <Text style={styles.uploadText}>
                    {uploading ? 'Uploading...' : 'Select Image'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

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

      {/* Monday Motivation Modal */}
      <Modal
        visible={showMotivationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMotivationModal(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Monday Motivation</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Topic</Text>
            <TextInput
              style={styles.input}
              value={motivationData.topic}
              onChangeText={(text) => setMotivationData({ ...motivationData, topic: text })}
              placeholder="Weekly Inspiration"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={motivationData.description}
              onChangeText={(text) => setMotivationData({ ...motivationData, description: text })}
              placeholder="Motivational message..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Video (Optional)</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickVideo}
              disabled={uploading}
            >
              {selectedVideo ? (
                <View style={styles.videoPreview}>
                  <Ionicons name="videocam" size={40} color="#666" />
                  <Text style={styles.uploadText}>Video Selected</Text>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Ionicons name="videocam" size={24} color="#666" />
                  <Text style={styles.uploadText}>
                    {uploading ? 'Uploading...' : 'Select Video'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowMotivationModal(false)}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton, isCreating && styles.disabledButton]}
              onPress={createMondayMotivation}
              disabled={isCreating || !motivationData.topic}
            >
              {isCreating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Thought of the Day Modal */}
      <Modal
        visible={showThoughtModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowThoughtModal(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Thought of the Day</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Topic</Text>
            <TextInput
              style={styles.input}
              value={thoughtData.topic}
              onChangeText={(text) => setThoughtData({ ...thoughtData, topic: text })}
              placeholder="Daily Wisdom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={thoughtData.content}
              onChangeText={(text) => setThoughtData({ ...thoughtData, content: text })}
              placeholder="Inspirational thought..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Video</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickVideo}
              disabled={uploading}
            >
              {selectedVideo ? (
                <View style={styles.videoPreview}>
                  <Ionicons name="videocam" size={40} color="#666" />
                  <Text style={styles.uploadText}>Video Selected</Text>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Ionicons name="videocam" size={24} color="#666" />
                  <Text style={styles.uploadText}>
                    {uploading ? 'Uploading...' : 'Select Video'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowThoughtModal(false)}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.createButton, isCreating && styles.disabledButton]}
              onPress={createThoughtOfTheDay}
              disabled={isCreating || !thoughtData.topic || !thoughtData.content}
            >
              {isCreating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Recommended Media Modal */}
      <Modal
        visible={showMediaModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMediaModal(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Recommended Media</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={mediaData.title}
              onChangeText={(text) => setMediaData({ ...mediaData, title: text })}
              placeholder="Atomic Habits"
            />
          </View>

          <View style={styles.inputGroup}>
  <Text style={styles.inputLabel}>Type</Text>
  <CustomDropdown
    options={[
      { label: 'Book', value: 'book' },
      { label: 'Movie', value: 'movie' }
    ]}
    selectedValue={mediaData.type}
    onSelect={(value: MediaType) => setMediaData({...mediaData, type: value})}
    placeholder="Select media type"
  />
</View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={mediaData.category}
              onChangeText={(text) => setMediaData({ ...mediaData, category: text })}
              placeholder="Personal Development"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={mediaData.description}
              onChangeText={(text) => setMediaData({ ...mediaData, description: text })}
              placeholder="Brief description..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Link (Optional)</Text>
            <TextInput
              style={styles.input}
              value={mediaData.link}
              onChangeText={(text) => setMediaData({ ...mediaData, link: text })}
              placeholder="https://example.com"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cover Image</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.uploadContent}>
                  <MaterialIcons name="add-a-photo" size={24} color="#666" />
                  <Text style={styles.uploadText}>
                    {uploading ? 'Uploading...' : 'Select Image'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowMediaModal(false)}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.createButton, isCreating && styles.disabledButton]}
              onPress={createRecommendedMedia}
              disabled={isCreating || !mediaData.title || !mediaData.category || !selectedImage}
            >
              {isCreating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Create</Text>
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
    backgroundColor: '#f5f5f5',
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
    marginBottom: 25,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
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
    marginTop: 30
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#000',
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1, // Ensure dropdown appears above other elements
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
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
  imageUploadButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContent: {
    alignItems: 'center',
    padding: 16,
  },
  uploadText: {
    marginTop: 8,
    color: '#666',
  },
  pickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
  },
});