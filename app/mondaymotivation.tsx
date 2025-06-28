import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const MondayMotivationScreen = () => {
  const motivationalMessages = [
    "New week, new opportunities! Stay focused and conquer your goals!",
    "Monday is the perfect day to correct last week's mistakes and build this week's successes.",
    "Your Monday morning thoughts set the tone for your whole week. See yourself getting stronger.",
    "Believe you can and you're halfway there. Let's make this week amazing!",
    "Success is the sum of small efforts repeated day in and day out. Start strong this Monday!"
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ImageBackground 
        source={require('@/assets/images/monday-bg.jpg')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="sunny" size={40} color="#FFD700" />
            <Text style={styles.title}>Monday Motivation</Text>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{randomMessage}</Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>Weekly Success Tip</Text>
            <Text style={styles.tipText}>
              "Start your week by writing down 3 main goals you want to accomplish. 
              Review them each morning to stay focused."
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/goal-setting')}
          >
            <Text style={styles.actionButtonText}>Set Weekly Goals</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  messageText: {
    fontSize: 18,
    lineHeight: 28,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tipContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  tipTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#0f0c29',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MondayMotivationScreen;