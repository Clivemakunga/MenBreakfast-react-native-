import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, FlatList, ActivityIndicator, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInLeft
} from 'react-native-reanimated';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { Video } from 'expo-av';
import { ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// MUX Configuration
const MUX_TOKEN_ID = '3101d59e-2f00-47a8-95c5-0f6aa2b49c4e';
const MUX_TOKEN_SECRET = 'joBbHbvFbicCtxmn6ixzAZEggoV3WW1DZN/qdzTNe3M+S98jkkyZlAjCUacGn3g7g7xqodwZ6CU';
const MUX_BASE_URL = 'https://api.mux.com';

const VideosScreen = () => {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const videoRef = useRef(null);
  
  // Fetch videos from MUX API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(
          `${MUX_BASE_URL}/video/v1/assets`,
          {
            auth: {
              username: MUX_TOKEN_ID,
              password: MUX_TOKEN_SECRET
            }
          }
        );
        
        const videoItems = response.data.data.map(asset => {
          const thumbnail = asset.playback_ids[0] ? 
            `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg?width=640` : 
            'https://placehold.co/640x360?text=No+Thumbnail';
          
          return {
            id: asset.id,
            title: asset.title || 'Untitled Video',
            speaker: 'MUX Speaker',
            thumbnail: thumbnail,
            duration: formatDuration(asset.duration),
            date: new Date(asset.created_at).toLocaleDateString(),
            playbackId: asset.playback_ids[0]?.id,
            videoUrl: `https://stream.mux.com/${asset.playback_ids[0]?.id}.m3u8`
          };
        });
        
        setVideos(videoItems);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const date = new Date(seconds * 1000);
    return date.toISOString().substr(11, 8).replace(/^00:/, '');
  };

  const playVideo = (video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setSelectedVideo(null);
  };

  const renderVideoItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInUp.duration(600).delay(index * 100)}
      style={styles.videoCard}
    >
      <TouchableOpacity onPress={() => playVideo(item)}>
        <ImageBackground 
          source={{ uri: item.thumbnail }}
          style={styles.videoThumbnail}
          borderRadius={12}
        >
          <View style={styles.videoDuration}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.videoOverlay}
          >
            <AntDesign name="playcircleo" size={36} color="white" />
          </LinearGradient>
        </ImageBackground>
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.videoSpeaker}>{item.speaker}</Text>
          <View style={styles.videoStats}>
            <Text style={styles.videoStat}>{item.views} views</Text>
            <Text style={styles.videoStat}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#6C63FF" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={[styles.container, styles.loadingContainer]}
      >
        <Text style={styles.errorText}>Error loading videos: {error}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={styles.title}>Video Library</Text>
          <Text style={styles.subtitle}>Watch and learn from our community</Text>
        </Animated.View>
        
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.videoGrid}
          contentContainerStyle={styles.videoList}
          scrollEnabled={false}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={30} color="white" />
          </Pressable>
          
          {selectedVideo && (
            <>
              <Video
                ref={videoRef}
                source={{ uri: selectedVideo.videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={false}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.modalTitle}>{selectedVideo.title}</Text>
                <Text style={styles.modalSpeaker}>{selectedVideo.speaker}</Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 60,
  },
  header: {
    marginBottom: 25,
    marginTop: 30
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  videoList: {
    paddingBottom: 20,
  },
  videoGrid: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  videoCard: {
    width: '48%',
    marginBottom: 20,
  },
  videoThumbnail: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
  },
  videoDetails: {
    paddingHorizontal: 5,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  videoSpeaker: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  videoStats: {
    flexDirection: 'row',
  },
  videoStat: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: 'black',
  },
  videoInfo: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalSpeaker: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default VideosScreen;