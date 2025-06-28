import { StyleSheet, Image, Platform, Alert, View, TextInput, TouchableOpacity, Text, Animated, Easing, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();

    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Sign Up', 'Please fill all the fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Sign Up', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Sign Up', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            surname,
          },
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Registration successful! Please check your email to confirm your account.');
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Sign Up Error', error.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.Image
          source={require('../assets/images/logo.png')}
          style={[styles.logo, { transform: [{ scale: scaleAnim }]}]}
          resizeMode="contain"
        />
          <Animated.Text
          style={[
            styles.mensBreakfast,
            {
              opacity: textAnim,
              transform: [
                { 
                  translateY: textAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }
              ]
            }
          ]}
        >
          Men's Breakfast (Byo)
        </Animated.Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us to get started</Text>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                {
                  translateY: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: inputAnim,
            },
          ]}
        >
          <MaterialIcons name="person" size={24} color="#6C63FF" />
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                {
                  translateY: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: inputAnim,
            },
          ]}
        >
          <MaterialIcons name="person" size={24} color="#6C63FF" />
          <TextInput
            style={styles.input}
            placeholder="Surname"
            placeholderTextColor="#999"
            value={surname}
            onChangeText={setSurname}
            autoCapitalize="none"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                {
                  translateY: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: inputAnim,
            },
          ]}
        >
          <MaterialIcons name="email" size={24} color="#6C63FF" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [
                {
                  translateY: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: inputAnim,
            },
          ]}
        >
          <MaterialIcons name="lock" size={24} color="#6C63FF" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [{ scale: buttonAnim }],
          }}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          style={styles.loginLink} 
          onPress={() => router.push('/')}
          disabled={loading}
        >
          <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 10,
    color: '#333',
    fontSize: 16,
  },
  button: {
    width: 300,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loginLink: {
    marginTop: 15,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#777',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  mensBreakfast: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6C63FF',
    marginBottom: 8,
    fontStyle: 'italic',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(108, 99, 255, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
});