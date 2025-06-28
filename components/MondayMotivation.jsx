import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MondayMotivation = ({ message }) => {
  return (
    <View style={styles.motivationCard}>
      <View style={styles.motivationHeader}>
        <Ionicons name="sunny" size={24} color="#FFD700" />
        <Text style={styles.motivationTitle}>Monday Motivation</Text>
      </View>
      <Text style={styles.motivationText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    motivationCard: { 
      backgroundColor: 'rgba(255,215,0,0.1)', 
      borderRadius: 12, 
      padding: 15, 
      marginBottom: 15, 
      borderWidth: 1, 
      borderColor: '#FFD70033' 
    },
    motivationHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 10 
    },
    motivationTitle: { 
      color: '#FFD700', 
      fontSize: 18, 
      marginLeft: 10 
    },
    motivationText: { 
      color: 'rgba(255,255,255,0.8)', 
      fontSize: 14, 
      lineHeight: 20 
    },
  });

export default MondayMotivation;