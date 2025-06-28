import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const UpcomingEvents = ({ events }) => {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity >
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsContainer}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventDate}>
              <Text style={styles.eventDay}>{new Date(event.date).getDate()}</Text>
              <Text style={styles.eventMonth}>
                {new Date(event.date).toLocaleString('default', { month: 'short' })}
              </Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
    sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 15, 
      marginTop: 10 
    },
    sectionTitle: { 
      fontSize: 20, 
      fontWeight: '600', 
      color: 'white' 
    },
    seeAll: { 
      color: '#2196F3', 
      fontSize: 14, 
      fontWeight: '500' 
    },
    eventsContainer: { 
      marginBottom: 20 
    },
    eventCard: { 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 12, 
      padding: 15, 
      marginBottom: 10, 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    eventDate: { 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 8, 
      padding: 10, 
      alignItems: 'center', 
      marginRight: 15 
    },
    eventDay: { 
      color: 'white', 
      fontSize: 20, 
      fontWeight: 'bold' 
    },
    eventMonth: { 
      color: 'rgba(255,255,255,0.7)', 
      fontSize: 12, 
      textTransform: 'uppercase' 
    },
    eventTitle: { 
      color: 'white', 
      fontSize: 14, 
      fontWeight: '500', 
      marginBottom: 4 
    },
    eventLocation: { 
      color: 'rgba(255,255,255,0.6)', 
      fontSize: 12 
    },
  });

export default UpcomingEvents;