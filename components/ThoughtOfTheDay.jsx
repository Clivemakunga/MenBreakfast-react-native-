import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const ThoughtOfTheDay = ({ thought }) => {
  return (
    <View style={styles.thoughtCard}>
      <Text style={styles.thoughtTitle}>Thought for the Day</Text>
      <Text style={styles.thoughtText} numberOfLines={3}>{thought}</Text>
      <TouchableOpacity 
       
      >
        <Text style={styles.readMore}>Read More →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    thoughtCard: { 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 15 
    },
    thoughtTitle: { 
      color: '#4CAF50', 
      fontSize: 16, 
      fontWeight: '600', 
      marginBottom: 10 
    },
    thoughtText: { 
      color: 'rgba(255,255,255,0.8)', 
      fontSize: 14, 
      lineHeight: 20 
    },
    readMore: {
      color: '#2196F3',
      fontSize: 14,
      marginTop: 8,
      textAlign: 'right',
    },
  });

export default ThoughtOfTheDay;