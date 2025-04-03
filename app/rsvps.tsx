import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, Image, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type RSVPWithDetails = {
  id: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    date: string;
  };
  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
    avatar_url: string;
  };
};

export default function AdminRSVPs() {
  const [rsvps, setRsvps] = useState<RSVPWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch RSVPs with user and event details
  const fetchRsvps = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select(`
          id,
          created_at,
          event:events(id, title, date),
          user:users(id, name, surname, image)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setRsvps(data as RSVPWithDetails[]);
      }
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRsvps();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchRsvps}
          tintColor="#FFFFFF"
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={[styles.title, styles.titleText]}>Event RSVPs</Text>
        <Text style={styles.subtitle}>{rsvps.length} total RSVPs</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading RSVPs...</Text>
        </View>
      ) : rsvps.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={48} color="gray" />
          <Text style={styles.emptyText}>No RSVPs found</Text>
        </Animated.View>
      ) : (
        <View style={styles.listContainer}>
          {rsvps.map((rsvp) => (
            <Animated.View 
              key={rsvp.id}
              entering={FadeInUp.duration(300).delay(100)}
              style={styles.rsvpCard}
            >
              <View style={styles.userInfo}>
                <Image
                  source={{ uri: rsvp.user.avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg' }}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, styles.subtitleText]}>{rsvp.user.name} {rsvp.user.surname}</Text>
                  <Text style={styles.userEmail}>{rsvp.user.email}</Text>
                </View>
              </View>

              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, styles.subtitleText]}>{rsvp.event.title}</Text>
                <Text style={styles.eventDate}>
                  {formatDate(rsvp.event.date)}
                </Text>
              </View>

              <View style={styles.rsvpMeta}>
                <Text style={styles.rsvpDate}>
                  RSVP'd on {formatDate(rsvp.created_at)}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  rsvpCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    color: '#000',
  },
  eventInfo: {
    marginBottom: 12,
    paddingLeft: 62, // Match avatar width + margin
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    opacity: 0.8,
    color: '#000',
  },
  rsvpMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    paddingLeft: 62,
  },
  rsvpDate: {
    fontSize: 12,
    opacity: 0.7,
    color: '#000',
  },
});