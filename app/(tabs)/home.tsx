import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInLeft, 
  SlideInRight, 
  ZoomIn,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// MUX Configuration
const MUX_TOKEN_ID = '3101d59e-2f00-47a8-95c5-0f6aa2b49c4e';
const MUX_TOKEN_SECRET = 'joBbHbvFbicCtxmn6ixzAZEggoV3WW1DZN/qdzTNe3M+S98jkkyZlAjCUacGn3g7g7xqodwZ6CU';
const MUX_BASE_URL = 'https://api.mux.com';

const HomeScreen = () => {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [userData, setUserData] = useState({ name: '', surname: '' });
  const videoRef = useRef(null);
  
  // Animation values
  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Fetch user data from Supabase
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('name, surname')
            .eq('id', user.id)
            .single();
          
          if (data) {
            setUserData({
              name: data.name || '',
              surname: data.surname || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Fetch featured videos from MUX
    const fetchFeaturedVideos = async () => {
      try {
        const response = await axios.get(
          `${MUX_BASE_URL}/video/v1/assets?limit=2&sort=created_at:desc`,
          {
            auth: {
              username: MUX_TOKEN_ID,
              password: MUX_TOKEN_SECRET
            },
            timeout: 10000
          }
        );
        
        const videos = response.data.data.map(asset => {
          const thumbnail = asset.playback_ids?.[0]?.id ? 
            `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg?width=640` : 
            'https://placehold.co/640x360?text=No+Thumbnail';
          
          return {
            id: asset.id,
            title: asset.title || 'Untitled Video',
            speaker: 'Mens Breakfast',
            thumbnail: thumbnail,
            duration: formatDuration(asset.duration),
            date: new Date(asset.created_at).toLocaleDateString(),
            playbackId: asset.playback_ids?.[0]?.id,
            videoUrl: asset.playback_ids?.[0]?.id ? `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8` : null
          };
        });
        
        setFeaturedVideos(videos);
      } catch (error) {
        console.error('Error fetching featured videos:', error);
        Alert.alert('Error', 'Failed to load featured videos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchFeaturedVideos();

    // Animation setup
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 1000 }),
      -1,
      true
    );
    
    rotate.value = withRepeat(
      withSpring(10, { damping: 2 }),
      -1,
      true
    );
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Morning' : 'Afternoon';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const date = new Date(seconds * 1000);
    return date.toISOString().substr(11, 8).replace(/^00:/, '');
  };

  const playVideo = (video) => {
    // Pause any currently playing video
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    
    // Set the new selected video
    setSelectedVideo(video);
  };

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setSelectedVideo(null);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));
  
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }]
  }));

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading featured content...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with animated title */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={styles.title}>Mens Breakfast</Text>
          <Animated.View entering={FadeIn.delay(400)}>
            <Text style={styles.subtitle}>
              Good {getGreeting()}, {userData.name} {userData.surname}.
            </Text>
          </Animated.View>
        </Animated.View>
        
        {/* Quick Stats Section */}
        <Animated.View entering={SlideInLeft.duration(600)} style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push('/events')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.statText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push('/videos')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="video-library" size={24} color="#FFC107" />
            <Text style={styles.statText}>Videos</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Featured Videos Section */}
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Videos</Text>
          <TouchableOpacity onPress={() => router.push('/videos')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {featuredVideos.length > 0 ? (
          <View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videosScroll}
            >
              {featuredVideos.map((video, index) => (
                <Animated.View 
                  key={video.id}
                  entering={ZoomIn.duration(600).delay(index * 200)}
                  style={styles.videoCard}
                >
                  <TouchableOpacity 
                    onPress={() => playVideo(video)}
                    activeOpacity={0.8}
                  >
                    <ImageBackground 
                      source={{ uri: video.thumbnail }}
                      style={styles.videoThumbnail}
                      borderRadius={12}
                      resizeMode="cover"
                    >
                      <View style={styles.videoDuration}>
                        <Text style={styles.durationText}>{video.duration}</Text>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.videoOverlay}
                      >
                        <AntDesign name="playcircleo" size={28} color="white" />
                      </LinearGradient>
                    </ImageBackground>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                      <Text style={styles.videoSpeaker}>{video.speaker}</Text>
                      <Text style={styles.videoDate}>{video.date}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>

            {/* Inline Video Player */}
            {selectedVideo && (
              <Animated.View 
                entering={FadeInUp.duration(400)}
                style={styles.inlinePlayerContainer}
              >
                <View style={styles.playerHeader}>
                  <Text style={styles.playerTitle}>Now Playing</Text>
                  <TouchableOpacity onPress={stopVideo}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.videoUrl }}
                  style={styles.inlineVideoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isLooping={false}
                  onError={(error) => {
                    console.error('Video error:', error);
                    Alert.alert('Error', 'Failed to play video');
                    stopVideo();
                  }}
                />
                <View style={styles.videoInfo}>
                  <Text style={styles.modalTitle}>{selectedVideo.title}</Text>
                  <Text style={styles.modalSpeaker}>{selectedVideo.speaker}</Text>
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off" size={40} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No featured videos available</Text>
          </View>
        )}

        {/* Financial Quick Actions */}
        <Animated.View entering={SlideInRight.duration(600).delay(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Tools</Text>
        </Animated.View>
        
        <View style={styles.financeGrid}>
          <Animated.View entering={FadeIn.delay(600)} style={[styles.financeCard, pulseStyle]}>
            <TouchableOpacity 
              style={[styles.cardButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => router.push('/finances')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="pie-chart" size={32} color="white" />
              <Text style={styles.cardText}>Budget</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(700)} style={[styles.financeCard, pulseStyle]}>
            <TouchableOpacity 
              style={[styles.cardButton, { backgroundColor: '#2196F3' }]}
              onPress={() => router.push('/invest')}
              activeOpacity={0.8}
            >
              <FontAwesome name="line-chart" size={32} color="white" />
              <Text style={styles.cardText}>Invest</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(800)} style={[styles.financeCard, pulseStyle]}>
            <TouchableOpacity 
              style={[styles.cardButton, { backgroundColor: '#FF9800' }]}
              onPress={() => router.push('/aiChat')}
              activeOpacity={0.8}
            >
              <Ionicons name="analytics" size={32} color="white" />
              <Text style={styles.cardText}>AI Insights</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(900)} style={[styles.financeCard, pulseStyle]}>
            <TouchableOpacity 
              style={[styles.cardButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => router.push('/mentor-info')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="psychology" size={32} color="white" />
              <Text style={styles.cardText}>Mentor Advice</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Mentor's Corner */}
        <Animated.View entering={FadeInUp.duration(600).delay(1000)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mentor's Corner</Text>
          <TouchableOpacity onPress={() => router.push('/mentor-info')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View entering={FadeIn.delay(1200)} style={styles.mentorCard}>
          <View style={styles.mentorHeader}>
            <Animated.View style={rotateStyle}>
              <Ionicons name="school" size={28} color="#FF5722" />
            </Animated.View>
            <Text style={styles.mentorTitle}>Today's Wisdom</Text>
          </View>
          <Text style={styles.mentorQuote}>
            "Invest in your growth as much as you invest in your finances."
          </Text>
          <TouchableOpacity 
            style={styles.watchButton}
            onPress={() => router.push('/videos')}
            activeOpacity={0.8}
          >
            <Text style={styles.watchButtonText}>Watch Video</Text>
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginVertical: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 30
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  seeAll: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  videosScroll: {
    paddingRight: 20,
  },
  videoCard: {
    width: 220,
    marginRight: 15,
  },
  videoThumbnail: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  videoInfo: {
    paddingHorizontal: 2,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  videoSpeaker: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  videoDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  // Inline video player styles
  inlinePlayerContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    marginTop: 15,
    padding: 10,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  inlineVideoPlayer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: 'black',
    borderRadius: 8,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  financeCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 15,
  },
  cardButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardText: {
    color: 'white',
    marginTop: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  mentorCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  mentorTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  mentorQuote: {
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: 15,
    fontSize: 14,
    lineHeight: 20,
  },
  watchButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF5722',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#FF5722',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  modalSpeaker: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default HomeScreen;