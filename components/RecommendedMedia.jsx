import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const RecommendedMedia = ({ recommendations }) => {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended Media</Text>
        <TouchableOpacity >
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        {recommendations.map((item) => (
          <View key={item.id} style={styles.mediaCard}>
            {typeof item.image === 'number' ? (
              // For required images (local assets)
              <Image source={item.image} style={styles.mediaImage} borderRadius={8} />
            ) : (
              // For URI-based images
              <ImageBackground source={{ uri: item.image }} style={styles.mediaImage} borderRadius={8}>
                <View style={styles.mediaTypeBadge}>
                  <Text style={styles.mediaTypeText}>{item.type}</Text>
                </View>
              </ImageBackground>
            )}
            <Text style={styles.mediaTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.mediaCategory}>{item.category}</Text>
          </View>
        ))}
      </ScrollView>
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
    horizontalScroll: { 
      paddingRight: 20 
    },
    mediaCard: { 
      width: 150, 
      marginRight: 15 
    },
    mediaImage: { 
      height: 220, 
      width: 150, 
      marginBottom: 8 
    },
    mediaTypeBadge: { 
      position: 'absolute', 
      top: 8, 
      right: 8, 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      paddingHorizontal: 6, 
      paddingVertical: 2, 
      borderRadius: 4 
    },
    mediaTypeText: { 
      color: 'white', 
      fontSize: 10, 
      fontWeight: '500' 
    },
    mediaTitle: { 
      color: 'white', 
      fontSize: 12, 
      fontWeight: '600', 
      marginTop: 4 
    },
    mediaCategory: { 
      color: 'rgba(255,255,255,0.6)', 
      fontSize: 10 
    },
  });

export default RecommendedMedia;