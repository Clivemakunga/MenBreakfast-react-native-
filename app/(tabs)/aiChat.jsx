import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout,
  SlideInRight,
  SlideInLeft
} from 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AIChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const typingAnimationRef = useRef(null);
  const insets = useSafeAreaInsets();

  const COHERE_API_KEY = 'xBnfXk8Cw1d3d8WoTOfFJZVt8o8sM6nfvYhvUTft'

  // Typing indicators
  const typingIndicators = [
    'Thinking...',
    'Researching...',
    'Analyzing...',
    'Processing...'
  ];

  // System prompt to guide the AI's behavior
  const systemPrompt = `You are a helpful financial and event planning AI assistant. 
  Provide detailed, professional answers with markdown formatting when appropriate.
  Your responses should be clear, concise, and tailored to the user's needs.`;

  // Load saved conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const savedChats = await SecureStore.getItemAsync('aiConversations');
        if (savedChats) {
          setMessages(JSON.parse(savedChats));
        }
      } catch (error) {
        console.error('Failed to load conversations', error);
      }
    };
    
    loadConversations();
  }, []);

  // Save conversations whenever messages change
  useEffect(() => {
    const saveConversations = async () => {
      try {
        await SecureStore.setItemAsync('aiConversations', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save conversations', error);
      }
    };
    
    if (messages.length > 0) {
      saveConversations();
    }
  }, [messages]);

  // Handle typing animation
  useEffect(() => {
    if (isTyping) {
      let counter = 0;
      typingAnimationRef.current = setInterval(() => {
        setTypingText(typingIndicators[counter % typingIndicators.length]);
        counter++;
      }, 2000);
    } else {
      clearInterval(typingAnimationRef.current);
    }

    return () => clearInterval(typingAnimationRef.current);
  }, [isTyping]);

  const generateWithCohere = async (prompt) => {
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Cohere-Version': '2022-12-06'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 1000,
          temperature: 0.7,
          k: 0,
          stop_sequences: ['USER:'],
          return_likelihoods: 'NONE'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Cohere API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const conversationHistory = [
        `SYSTEM: ${systemPrompt}`,
        ...messages
          .filter(msg => msg.sender === 'user')
          .slice(-5)
          .map(msg => `USER: ${msg.text}\nASSISTANT:`),
        `USER: ${inputText}\nASSISTANT:`
      ].join('\n');

      const response = await generateWithCohere(conversationHistory);
      const aiText = response.generations[0].text.trim();

      const aiMessage = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to the AI service. Please try again later.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const clearConversation = async () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to delete all messages?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await SecureStore.deleteItemAsync('aiConversations');
          }
        }
      ]
    );
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    const isFirstInGroup = index === 0 || messages[index - 1].sender !== message.sender;

    return (
      <Animated.View
        key={message.id}
        entering={isUser ? SlideInRight : SlideInLeft}
        layout={Layout.duration(300)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
          isFirstInGroup && { marginTop: 12 }
        ]}
      >
        <View style={styles.messageHeader}>
          {!isUser && (
            <View style={styles.aiAvatar}>
              <MaterialIcons name="smart-toy" size={20} color="#fff" />
            </View>
          )}
          <Text style={styles.senderText}>
            {isUser ? 'You' : 'Financial AI'}
          </Text>
          <Text style={styles.timeText}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <View style={styles.messageContent}>
          {isUser ? (
            <Text style={styles.messageText}>{message.text}</Text>
          ) : (
            <Markdown style={markdownStyles}>
              {message.text}
            </Markdown>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="smart-toy" size={28} color="#2196F3" />
          <Text style={styles.headerTitle}>Financial AI Assistant</Text>
        </View>
        <TouchableOpacity onPress={clearConversation}>
          <Ionicons name="trash-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 100 }]}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <Animated.View entering={FadeInUp} style={styles.emptyState}>
            <MaterialIcons name="chat" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>How can I help you today?</Text>
            <Text style={styles.emptySubtitle}>
              I can help with financial planning, event management, investment strategies, and more.
            </Text>
            
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText("How should I allocate my event budget?")}
              >
                <Text style={styles.suggestionText}>"How should I allocate my event budget?"</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText("What are good low-risk investments for beginners?")}
              >
                <Text style={styles.suggestionText}>"What are good low-risk investments for beginners?"</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText("Create a 6-month financial plan for a small business")}
              >
                <Text style={styles.suggestionText}>"Create a 6-month financial plan for a small business"</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          messages.map(renderMessage)
        )}

        {(isLoading || isTyping) && (
          <Animated.View entering={FadeInUp} style={styles.loadingContainer}>
            <View style={styles.aiMessageContainer}>
              <View style={styles.messageHeader}>
                <View style={styles.aiAvatar}>
                  <MaterialIcons name="smart-toy" size={20} color="#fff" />
                </View>
                <Text style={styles.senderText}>Financial AI</Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#2196F3" style={styles.loadingIndicator} />
              ) : (
                <Text style={styles.typingText}>{typingText}</Text>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : insets.bottom + 60}
        style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}
      >
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Message Financial AI..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={inputText}
          onChangeText={setInputText}
          multiline
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            inputText.trim() && styles.activeSendButton
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={inputText.trim() ? "#2196F3" : "rgba(255,255,255,0.3)"} 
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const markdownStyles = {
  body: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginVertical: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  em: {
    fontStyle: 'italic',
    color: '#E91E63',
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    paddingLeft: 12,
    marginVertical: 8,
  },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FF5722',
    paddingHorizontal: 4,
    borderRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  code_block: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FF5722',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fence: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FF5722',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  list_item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginTop: Platform.OS === 'ios' ? 30 : 0
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  suggestionsContainer: {
    marginTop: 30,
    width: '100%',
  },
  suggestionsTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  suggestionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  messageContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderTopRightRadius: 4,
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  senderText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  messageContent: {
    marginLeft: 32,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  typingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 32,
    marginVertical: 12,
  },
  loadingContainer: {
    marginTop: 8,
  },
  loadingIndicator: {
    marginLeft: 32,
    marginVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 50
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSendButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
});

export default AIChatScreen;