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
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  type: string;
  attendees: number;
};

const ManageEventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    image_url: '',
    type: 'conference'
  });

  // Function to count RSVPs for each event
  const countAttendees = async (eventsData: Event[]) => {
    try {
      // Get all RSVPs
      const { data: rsvps, error } = await supabase
        .from('rsvps')
        .select('event_id');

      if (error) throw error;

      // Count RSVPs per event
      const attendeeCounts: Record<string, number> = {};
      rsvps?.forEach(rsvp => {
        if (!attendeeCounts[rsvp.event_id]) {
          attendeeCounts[rsvp.event_id] = 0;
        }
        attendeeCounts[rsvp.event_id]++;
      });

      // Update events with attendee counts
      return eventsData.map(event => ({
        ...event,
        attendees: attendeeCounts[event.id] || 0
      }));
    } catch (error) {
      console.error('Error counting attendees:', error);
      return eventsData; // Return original data if error occurs
    }
  };

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Update events with attendee counts
      const eventsWithAttendees = await countAttendees(data || []);
      setEvents(eventsWithAttendees);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle edit button click
  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      location: event.location,
      image_url: event.image_url,
      type: event.type
    });
    setShowEditModal(true);
  };

  // Handle delete event
  const handleDelete = async (eventId: string) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`delete-${eventId}`]: true }));
      
      // First delete all RSVPs for this event
      const { error: rsvpError } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', eventId);

      if (rsvpError) throw rsvpError;

      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`delete-${eventId}`]: false }));
    }
  };

  // Confirm before deleting
  const confirmDelete = (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${eventTitle}"? This will also remove all RSVPs for this event.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleDelete(eventId), style: 'destructive' }
      ]
    );
  };

  // Handle form submission
  const handleSubmitEdit = async () => {
    if (!selectedEvent) return;

    try {
      setLoadingActions(prev => ({ ...prev, [`edit-${selectedEvent.id}`]: true }));
      
      const { error } = await supabase
        .from('events')
        .update({
          title: editForm.title,
          description: editForm.description,
          date: editForm.date.toISOString(),
          location: editForm.location,
          image_url: editForm.image_url,
          type: editForm.type
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? { 
          ...event, 
          ...editForm,
          date: editForm.date.toISOString()
        } : event
      ));

      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`edit-${selectedEvent.id}`]: false }));
    }
  };

  // Date picker handler
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditForm({ ...editForm, date: selectedDate });
    }
  };

  const renderEventItem = ({ item, index }: { item: Event, index: number }) => {
    const eventDate = new Date(item.date);
    const isEditing = loadingActions[`edit-${item.id}`];
    const isDeleting = loadingActions[`delete-${item.id}`];

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={styles.eventCard}
      >
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.eventImage} 
          resizeMode="cover"
        />
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, styles.subtitleText]}>{item.title}</Text>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={16} color="#666" />
              <Text style={styles.detailText}>
                {eventDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={16} color="#666" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome name="users" size={16} color="#666" />
              <Text style={styles.detailText}>{item.attendees} {item.attendees === 1 ? 'attendee' : 'attendees'}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
              disabled={isEditing || isDeleting}
            >
              <MaterialIcons name="edit" size={18} color="white" />
              <Text style={styles.actionButtonText}>
                {isEditing ? 'Updating...' : 'Edit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => confirmDelete(item.id, item.title)}
              disabled={isEditing || isDeleting}
            >
              <MaterialIcons name="delete" size={18} color="white" />
              <Text style={styles.actionButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchEvents}
          tintColor="#FFFFFF"
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={[styles.title, styles.titleText]}>Manage Events</Text>
        <Text style={styles.subtitle}>{events.length} total events</Text>
      </Animated.View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="gray" />
          <Text style={styles.emptyText}>No events found</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Edit Event Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditModal(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={[styles.modalTitle, styles.titleText]}>Edit Event</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Title</Text>
            <TextInput
              style={styles.input}
              value={editForm.title}
              onChangeText={(text) => setEditForm({ ...editForm, title: text })}
              placeholder="Event title"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.description}
              onChangeText={(text) => setEditForm({ ...editForm, description: text })}
              placeholder="Event description"
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date & Time</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>
                {editForm.date.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={editForm.date}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editForm.location}
              onChangeText={(text) => setEditForm({ ...editForm, location: text })}
              placeholder="Event location"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={editForm.image_url}
              onChangeText={(text) => setEditForm({ ...editForm, image_url: text })}
              placeholder="https://example.com/image.jpg"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSubmitEdit}
              disabled={loadingActions[`edit-${selectedEvent?.id}`] || !editForm.title || !editForm.location}
            >
              <Text style={styles.modalButtonText}>
                {loadingActions[`edit-${selectedEvent?.id}`] ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
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
  },
  titleText: {
    color: '#000', // Default text color for titles
  },
  subtitleText: {
    color: '#000', // Default text color for subtitles
    fontSize: 18,
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
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalContainer: {
    flexGrow: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
});

export default ManageEventsScreen;