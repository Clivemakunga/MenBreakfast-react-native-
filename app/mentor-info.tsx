import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MentorsScreen = () => {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Mentors Advice</Text>
          <Text style={styles.subtitle}>Get personalized guidance from industry experts</Text>
        </View>
      </View>

      {/* Rest of your content remains the same */}
      <View style={styles.comingSoonBanner}>
        <Ionicons name="time-outline" size={40} color="#fff" />
        <Text style={styles.bannerTitle}>Coming Soon!</Text>
        <Text style={styles.bannerText}>
          We're working hard to bring you the best mentorship experience.
        </Text>
        <TouchableOpacity style={styles.notifyButton}>
          <Text style={styles.notifyButtonText}>Notify Me</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mentorsGrid}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.mentorCard}>
            <View style={styles.mentorAvatar} />
            <Text style={styles.mentorName}>Expert Mentor</Text>
            <Text style={styles.mentorSpecialty}>Specialization: Loading...</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Your styles remain the same
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  comingSoonBanner: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  bannerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  notifyButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 10,
  },
  notifyButtonText: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  mentorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mentorCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  mentorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  mentorName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  mentorSpecialty: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default MentorsScreen;