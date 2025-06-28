import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Linking, 
  TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

const EventDetailsScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const event = {
    id: params.id,
    title: params.title,
    date: new Date(params.date as string),
    location: params.location,
    image_url: params.image_url,
    attendees: parseInt(params.attendees as string),
    description: params.description,
    organizer: params.organizer
  };

  const handleOpenMaps = () => {
    const encodedLocation = encodeURIComponent(event.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`);
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View entering={FadeIn.delay(300)} style={styles.header}>
          <Image
            source={{ uri: event.image_url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={SlideInRight.delay(400)} style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.detailSection}>
            <MaterialIcons name="event" size={24} color="#FFFFFF" />
            <Text style={styles.detailText}>
              {event.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.detailSection}
            onPress={handleOpenMaps}
          >
            <MaterialIcons name="location-on" size={24} color="#FFFFFF" />
            <Text style={[styles.detailText, styles.link]}>{event.location}</Text>
          </TouchableOpacity>

          <View style={styles.detailSection}>
            <MaterialIcons name="people" size={24} color="#FFFFFF" />
            <Text style={styles.detailText}>
              {event.attendees} confirmed attendees
            </Text>
          </View>

          <View style={styles.detailSection}>
            <MaterialIcons name="business" size={24} color="#FFFFFF" />
            <Text style={styles.detailText}>Organized by: {event.organizer}</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 350,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25,
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  detailText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  descriptionSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  descriptionText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default EventDetailsScreen;