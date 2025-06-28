import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type ThoughtData = {
  id: string;
  topic: string;
  content: string;
  video_url: string | null;
  created_at: string;
  created_by: string;
};

const ThoughtOfTheDayScreen = () => {
  const { id } = useLocalSearchParams();
  const [thought, setThought] = useState<ThoughtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThought = async () => {
      try {
        setLoading(true);
        
        // If we have a full thought passed directly (from navigation params)
        if (typeof id !== 'string' && typeof id !== 'number') {
          setThought(id as unknown as ThoughtData);
          return;
        }

        // Fetch from Supabase if we only have an ID
        const { data, error } = await supabase
          .from('thoughts_of_day')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Thought not found');

        setThought(data);
      } catch (err) {
        console.error('Error fetching thought:', err);
        setError(err.message || 'Failed to load thought');
      } finally {
        setLoading(false);
      }
    };

    fetchThought();
  }, [id]);

  if (loading) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading thought...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!thought) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Thought not found</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{thought.topic || 'Thought for the Day'}</Text>
        <Text style={styles.thoughtText}>{thought.content}</Text>
        
        {thought.video_url && (
          <View style={styles.videoContainer}>
            <Text style={styles.sectionTitle}>Video Content</Text>
            {/* You would implement your video player component here */}
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Video Player</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.dateText}>
          {new Date(thought.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    marginTop: 40,
    paddingHorizontal: 15,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  thoughtText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  videoContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    marginBottom: 10,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
  },
  dateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ThoughtOfTheDayScreen;