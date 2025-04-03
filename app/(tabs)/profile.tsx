import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUserEmail(user.email || '');

        const { data, error } = await supabase
          .from('users')
          .select('admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setIsAdmin(data?.admin || false);
      } catch (error) {
        console.error('Error fetching admin status:', error);
        Alert.alert('Error', 'Failed to check admin privileges');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserData();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loaderText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {userEmail ? (
        <>
          <View style={styles.profileInfo}>
            <Ionicons name="person-circle" size={80} color="#6C63FF" />
            <Text style={styles.email}>{userEmail}</Text>
            <Text style={styles.role}>{isAdmin ? 'Administrator' : 'Regular User'}</Text>
          </View>
          
          {isAdmin ? (
            <Pressable
              style={styles.adminButton}
              onPress={() => router.push('/adminhome')}
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.buttonText}>Admin Dashboard</Text>
            </Pressable>
          ) : (
            <View style={styles.regularUserOptions}>
              <Pressable
                style={styles.regularButton}
                onPress={() => Alert.alert('Info', 'Regular user features coming soon!')}
              >
                <Ionicons name="person" size={20} color="white" />
                <Text style={styles.buttonText}>My Account</Text>
              </Pressable>
              <Pressable
                style={styles.regularButton}
                onPress={() => Alert.alert('Info', 'Settings coming soon!')}
              >
                <Ionicons name="settings" size={20} color="white" />
                <Text style={styles.buttonText}>Settings</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.signOutButton}
            onPress={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) Alert.alert('Error', error.message);
            }}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.signInButton}
          onPress={() => router.push('/sign-in')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f0c29', // Dark blue from gradient
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0c29',
  },
  loaderText: {
    marginTop: 10,
    color: '#6C63FF', // Purple accent
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    color: 'white',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  email: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    color: 'white',
  },
  role: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF', // Purple accent
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  regularUserOptions: {
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  regularButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent white
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  signInButton: {
    backgroundColor: '#6C63FF', // Purple accent
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#FF6B6B', // Soft red that fits the scheme
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});