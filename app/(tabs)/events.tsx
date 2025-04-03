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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInRight, 
  Layout,
  LightSpeedInLeft,
  LightSpeedInRight
} from 'react-native-reanimated';
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  image_url: string;
  type: string;
  rsvp: boolean;
  isPastEvent?: boolean;
};

const EventsScreen = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingRSVP, setLoadingRSVP] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Count RSVPs for each event and update the attendees count
  const updateAttendeeCounts = async (eventsData: Event[]) => {
    try {
      // Get all RSVPs
      const { data: allRsvps, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('event_id');

      if (rsvpsError) throw rsvpsError;

      // Count RSVPs per event
      const rsvpCounts: Record<string, number> = {};
      allRsvps?.forEach(rsvp => {
        if (!rsvpCounts[rsvp.event_id]) {
          rsvpCounts[rsvp.event_id] = 0;
        }
        rsvpCounts[rsvp.event_id]++;
      });

      // Update events with the correct attendee counts
      return eventsData.map(event => ({
        ...event,
        attendees: rsvpCounts[event.id] || 0
      }));

    } catch (error) {
      console.error('Error updating attendee counts:', error);
      return eventsData; // Return original data if error occurs
    }
  };

  // Fetch events and RSVP status from Supabase
  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const now = new Date();

      // Get all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Update attendee counts based on RSVPs
      const eventsWithAttendeeCounts = await updateAttendeeCounts(eventsData);

      // Get user's RSVPs if logged in
      let rsvpedEventIds: string[] = [];
      if (user) {
        const { data: rsvpsData, error: rsvpsError } = await supabase
          .from('rsvps')
          .select('event_id')
          .eq('user_id', user.id);

        if (rsvpsError) throw rsvpsError;
        rsvpedEventIds = rsvpsData.map(r => r.event_id);
      }

      // Transform data with RSVP status and past event flag
      const formattedEvents = eventsWithAttendeeCounts?.map(event => {
        const eventDate = new Date(event.date);
        const isPastEvent = eventDate <= now;
        
        return {
          ...event,
          image: event.image_url,
          rsvp: rsvpedEventIds.includes(event.id),
          isPastEvent
        };
      }) || [];

      setEvents(formattedEvents);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events based on selected filter
  const filteredEvents = events.filter(event => {
    if (activeFilter === 'upcoming') {
      return !event.isPastEvent;
    } else if (activeFilter === 'past') {
      return event.isPastEvent;
    }
    return true;
  });

  const onRefresh = async () => {
    await fetchEvents();
  };

  const handleRSVP = async (eventId: string) => {
    try {
      setLoadingRSVP(eventId);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert('Login Required', 'Please sign in to RSVP');
        return;
      }

      // Check if already RSVP'd
      const { data: existingRSVP, error: checkError } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existingRSVP) {
        Alert.alert('Already RSVPd', 'You have already RSVPd to this event');
        return;
      }

      // Create new RSVP
      const { error } = await supabase
        .from('rsvps')
        .insert({
          event_id: eventId,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Get updated RSVP count for this event
      const { count } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Update local state
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, rsvp: true, attendees: count || event.attendees + 1 } 
          : event
      ));

    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to process RSVP');
    } finally {
      setLoadingRSVP(null);
    }
  };

  const renderEventItem = ({ item, index }: { item: Event, index: number }) => {
    const eventDate = new Date(item.date);
    const isPastEvent = item.isPastEvent || false;
    const isRSVPDisabled = isPastEvent || item.rsvp || loadingRSVP === item.id;
    
    return (
      <Animated.View 
        entering={index % 2 === 0 ? LightSpeedInLeft.delay(index * 100) : LightSpeedInRight.delay(index * 100)}
        layout={Layout.duration(300)}
        style={styles.eventCard}
      >
        <TouchableOpacity onPress={() => router.push(`/events/${item.id}`)}>
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.eventImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.eventOverlay}
          >
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={styles.eventDetails}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color="rgba(255,255,255,0.8)" />
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
                  <Feather name="map-pin" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome name="users" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.detailText}>{item.attendees} attendees</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.rsvpButton,
            item.rsvp ? styles.rsvpButtonActive : styles.rsvpButtonInactive,
            isRSVPDisabled ? styles.rsvpButtonDisabled : null,
            loadingRSVP === item.id ? styles.rsvpButtonLoading : null
          ]}
          onPress={() => handleRSVP(item.id)}
          disabled={isRSVPDisabled}
        >
          <Text style={styles.rsvpButtonText}>
            {isPastEvent 
              ? 'Event Ended' 
              : item.rsvp 
                ? '✓ RSVP Confirmed' 
                : loadingRSVP === item.id 
                  ? 'Processing...' 
                  : 'RSVP Now'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            title={`Last updated: ${lastRefreshTime.toLocaleTimeString()}`}
            titleColor="rgba(255,255,255,0.7)"
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.title}>
            {activeFilter === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: {lastRefreshTime.toLocaleTimeString()}
          </Text>
        </Animated.View>

        <Animated.View entering={SlideInRight.delay(300)} style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {['upcoming', 'past'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilter
                ]}
                onPress={() => setActiveFilter(filter as 'upcoming' | 'past')}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {filteredEvents.length > 0 ? (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={<View style={{ height: 30 }} />}
          />
        ) : (
          <Animated.View entering={FadeIn.delay(400)} style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>
              {activeFilter === 'upcoming' 
                ? 'No upcoming events' 
                : 'No past events'}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
    marginTop: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    color: 'white',
    fontWeight: '500',
  },
  activeFilterText: {
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  eventCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  eventContent: {
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
    fontSize: 14,
  },
  rsvpButton: {
    padding: 12,
    alignItems: 'center',
  },
  rsvpButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rsvpButtonActive: {
    backgroundColor: '#4CAF50',
  },
  rsvpButtonDisabled: {
    backgroundColor: '#607D8B',
    opacity: 0.7,
  },
  rsvpButtonLoading: {
    backgroundColor: '#607D8B',
  },
  rsvpButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
  },
});

export default EventsScreen;