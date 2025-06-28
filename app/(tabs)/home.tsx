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
  withTiming,
  FadeInRight
} from 'react-native-reanimated';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Import components
import ThoughtOfTheDay from '@/components/ThoughtOfTheDay';
import MondayMotivation from '@/components/MondayMotivation';
import RecommendedMedia from '@/components/RecommendedMedia';
import UpcomingEvents from '@/components/UpcomingEvents';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MUX_TOKEN_ID = '3101d59e-2f00-47a8-95c5-0f6aa2b49c4e';
const MUX_TOKEN_SECRET = 'joBbHbvFbicCtxmn6ixzAZEggoV3WW1DZN/qdzTNe3M+S98jkkyZlAjCUacGn3g7g7xqodwZ6CU';
const MUX_BASE_URL = 'https://api.mux.com';

const HomeScreen = () => {
  // State variables
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [userData, setUserData] = useState({ name: '', surname: '' });
  const [thoughtOfTheDay, setThoughtOfTheDay] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [otherEvents, setOtherEvents] = useState([]);
  const videoRef = useRef(null);


  // Animation values
  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);
  const motivationalMessage = "New week, new opportunities! Stay focused and conquer your goals!";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('name, surname')
            .eq('id', user.id)
            .single();
          if (data) setUserData({ name: data.name || '', surname: data.surname || '' });
        }

        // Fetch featured videos
        const videosResponse = await axios.get(
          `${MUX_BASE_URL}/video/v1/assets?limit=2&sort=created_at:desc`,
          { auth: { username: MUX_TOKEN_ID, password: MUX_TOKEN_SECRET }, timeout: 10000 }
        );

        const videos = videosResponse.data.data.map(asset => ({
          id: asset.id,
          title: asset.title || 'Untitled Video',
          speaker: 'Mens Breakfast',
          thumbnail: asset.playback_ids?.[0]?.id ?
            `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg?width=640` :
            'https://placehold.co/640x360?text=No+Thumbnail',
          duration: formatDuration(asset.duration),
          date: new Date(asset.created_at).toLocaleDateString(),
          playbackId: asset.playback_ids?.[0]?.id,
          videoUrl: asset.playback_ids?.[0]?.id ? `https://stream.mux.com/${asset.playback_ids[0].id}.m3u8` : null
        }));
        setFeaturedVideos(videos);

        // Initialize sample data (replace with actual API calls)
        setThoughtOfTheDay("The only way to do great work is to love what you do. - Steve Jobs");
        setRecommendations([
          {
            id: 1,
            title: 'How Innovation Works',
            type: 'Book',
            category: 'Personal Development',
            image: require('../../assets/images/book1.jpg') // or the correct path to your image
          },
          {
            id: 2,
            title: 'Company Of One',
            type: 'Book',
            category: 'Inspirational',
            image: require('../../assets/images/book2.jpg') // or the correct path to your image
          },
          {
            id: 3,
            title: 'The Fine Print',
            type: 'Book',
            category: 'Inspirational',
            image: require('../../assets/images/book3.jpg') // or the correct path to your image
          }
        ]);
        setOtherEvents([
          {
            id: 1,
            title: 'Community Service Day',
            date: '2024-03-25',
            location: 'City Center'
          },
          {
            id: 2,
            title: 'Leadership Workshop',
            date: '2024-03-28',
            location: 'Conference Hall'
          }
        ]);

      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Animation setup
    pulse.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
    rotate.value = withRepeat(withSpring(10, { damping: 2 }), -1, true);
  }, []);

  // Helper functions
  const getGreeting = () => new Date().getHours() < 12 ? 'Morning' : 'Afternoon';
  const formatDuration = (seconds) => seconds ? new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^00:/, '') : '00:00';
  const isMonday = () => new Date().getDay() === 1;

  // Video controls
  const playVideo = (video) => {
    if (videoRef.current) videoRef.current.pauseAsync();
    setSelectedVideo(video);
  };

  const stopVideo = () => {
    if (videoRef.current) videoRef.current.pauseAsync();
    setSelectedVideo(null);
  };

  // Animation styles
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotateStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  if (loading) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading featured content...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={styles.title}>Mens Breakfast</Text>
          <Animated.View entering={FadeIn.delay(400)}>
            <Text style={styles.subtitle}>Good {getGreeting()}, {userData.name} {userData.surname}.</Text>
          </Animated.View>
        </Animated.View>

        {/* Monday Motivation */}
        {isMonday() && (
          <MondayMotivation message={motivationalMessage} />
        )}

        {/* Thought for the Day */}
        <ThoughtOfTheDay thought={thoughtOfTheDay} />

        {/* Recommended Media */}
        <RecommendedMedia recommendations={recommendations} />

        {/* Upcoming Events */}
        <UpcomingEvents events={otherEvents} />

        {/* Featured Videos Section */}
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Videos</Text>
          <TouchableOpacity onPress={() => router.push('/videos')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </Animated.View>

        {featuredVideos.length > 0 ? (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videosScroll}>
              {featuredVideos.map((video, index) => (
                <Animated.View key={video.id} entering={ZoomIn.duration(600).delay(index * 200)} style={styles.videoCard}>
                  <TouchableOpacity onPress={() => playVideo(video)} activeOpacity={0.8}>
                    <ImageBackground source={{ uri: video.thumbnail }} style={styles.videoThumbnail} borderRadius={12}>
                      <View style={styles.videoDuration}>
                        <Text style={styles.durationText}>{video.duration}</Text>
                      </View>
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.videoOverlay}>
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

            {/* Video Player */}
            {selectedVideo && (
              <Animated.View entering={FadeInUp.duration(400)} style={styles.inlinePlayerContainer}>
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

        {/* Financial Tools */}
        <Animated.View entering={SlideInRight.duration(600).delay(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Tools</Text>
        </Animated.View>

        <View style={styles.financeGrid}>
          {[
            { icon: 'pie-chart', text: 'Budget', color: '#4CAF50', route: '/finances' },
            { icon: 'newspaper', text: 'Blogs', color: '#2196F3', route: '/invest' },
            { icon: 'analytics', text: 'AI Insights', color: '#FF9800', route: '/aiChat' },
            { icon: 'psychology', text: 'Mentor Advice', color: '#9C27B0', route: '/mentor-info' },
          ].map((item, index) => (
            <Animated.View
              key={item.text}
              entering={FadeIn.delay(600 + index * 100)}
              style={[styles.financeCard, pulseStyle]}
            >
              <TouchableOpacity
                style={[styles.cardButton, { backgroundColor: item.color }]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <MaterialIcons name={item.icon} size={32} color="white" />
                <Text style={styles.cardText}>{item.text}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 15, fontSize: 16 },
  header: { marginBottom: 20, marginTop: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: 'white' },
  seeAll: { color: '#2196F3', fontSize: 14, fontWeight: '500' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 5 },
  statText: { color: 'white', marginLeft: 10, fontSize: 14, fontWeight: '500' },
  videosScroll: { paddingRight: 20 },
  videoCard: { width: 220, marginRight: 15 },
  videoThumbnail: { height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  videoOverlay: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  videoDuration: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: 'white', fontSize: 10, fontWeight: '500' },
  videoInfo: { paddingHorizontal: 2 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: 'white', marginBottom: 4 },
  videoSpeaker: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  videoDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  inlinePlayerContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, marginTop: 15, padding: 10 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  playerTitle: { color: 'white', fontWeight: '600', fontSize: 16 },
  inlineVideoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: 'black', borderRadius: 8 },
  financeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  financeCard: { width: '48%', aspectRatio: 1, marginBottom: 15 },
  cardButton: { flex: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 10 },
  cardText: { color: 'white', marginTop: 10, fontWeight: '600', textAlign: 'center' },
  mentorCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginBottom: 20 },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  mentorTitle: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  mentorQuote: { color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: 15, fontSize: 14, lineHeight: 20 },
  watchButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF5722', paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  watchButtonText: { color: '#FF5722', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginVertical: 10 },
  emptyText: { color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 16 },
  motivationCard: { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#FFD70033' },
  motivationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  motivationTitle: { color: '#FFD700', fontSize: 18, marginLeft: 10 },
  motivationText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  thoughtCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginBottom: 15 },
  thoughtTitle: { color: '#4CAF50', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  thoughtText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  mediaCard: { width: 150, marginRight: 15 },
  mediaImage: { height: 220, width: 150, marginBottom: 8 },
  mediaTypeBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mediaTypeText: { color: 'white', fontSize: 10, fontWeight: '500' },
  mediaTitle: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },
  mediaCategory: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  eventsContainer: { marginBottom: 20 },
  eventCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  eventDate: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 10, alignItems: 'center', marginRight: 15 },
  eventDay: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  eventMonth: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textTransform: 'uppercase' },
  eventTitle: { color: 'white', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  eventLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  horizontalScroll: { paddingRight: 20 },
  readMore: {
    color: '#2196F3',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
});

export default HomeScreen;