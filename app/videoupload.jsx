import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import axios from 'axios';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// MUX Configuration - Replace with your credentials
const MUX_TOKEN_ID = '3101d59e-2f00-47a8-95c5-0f6aa2b49c4e';
const MUX_TOKEN_SECRET = 'joBbHbvFbicCtxmn6ixzAZEggoV3WW1DZN/qdzTNe3M+S98jkkyZlAjCUacGn3g7g7xqodwZ6CU';
const MUX_BASE_URL = 'https://api.mux.com';
const MAX_FILE_SIZE_MB = 100; // 100MB limit

const VideoUploadScreen = () => {
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required', 
          'We need access to your media library to upload videos'
        );
      }
    })();
  }, []);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled video selection');
        return;
      }

      const selectedVideo = result.assets[0];
      if (!selectedVideo.uri) {
        throw new Error('No video URI found');
      }

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(selectedVideo.uri);
      if (fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.alert(
          'File too large',
          `Please select a video smaller than ${MAX_FILE_SIZE_MB}MB`
        );
        return;
      }

      setVideo({
        uri: selectedVideo.uri,
        name: selectedVideo.fileName || selectedVideo.uri.split('/').pop() || `video-${Date.now()}.mp4`,
        type: selectedVideo.mimeType || 'video/mp4',
        size: fileInfo.size
      });

    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled file selection');
        return;
      }

      const selectedFile = result.assets[0];
      if (!selectedFile.uri) {
        throw new Error('No file URI found');
      }

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
      if (fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.alert(
          'File too large',
          `Please select a video smaller than ${MAX_FILE_SIZE_MB}MB`
        );
        return;
      }

      setVideo({
        uri: selectedFile.uri,
        name: selectedFile.name || selectedFile.uri.split('/').pop() || `video-${Date.now()}.mp4`,
        type: selectedFile.mimeType || 'video/mp4',
        size: fileInfo.size
      });

    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select video file. Please try again.');
    }
  };

  const validateUpload = () => {
    if (!video) return 'Please select a video first';
    if (!video.uri) return 'Invalid video file';
    if (video.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Video must be smaller than ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  };

  const uploadVideo = async () => {
    const validationError = validateUpload();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      // Step 1: Create upload URL with MUX
      const uploadResponse = await axios.post(
        `${MUX_BASE_URL}/video/v1/uploads`,
        {
          cors_origin: '*',
          new_asset_settings: {
            playback_policy: ['public'],
            // Removed deprecated mp4_support parameter
            title: title || 'Untitled Video',
            description: description || '',
          },
        },
        {
          auth: {
            username: MUX_TOKEN_ID,
            password: MUX_TOKEN_SECRET,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      const uploadUrl = uploadResponse.data.data.url;
      const uploadId = uploadResponse.data.data.id;
  
      // Step 2: Prepare the file for upload
      const fileInfo = await FileSystem.getInfoAsync(video.uri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }
  
      // Step 3: Upload the file with progress tracking
      const uploadTask = FileSystem.createUploadTask(
        uploadUrl,
        video.uri,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
        (uploadProgress) => {
          const progress = Math.round(
            (uploadProgress.totalBytesSent / uploadProgress.totalBytesExpectedToSend) * 100
          );
          setUploadProgress(progress);
        }
      );
  
      const uploadResult = await uploadTask.uploadAsync();
  
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }
  
      // Step 4: Poll for asset readiness
      let assetReady = false;
      let assetId;
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 5000;
  
      while (!assetReady && attempts < maxAttempts) {
        attempts++;
        try {
          const statusResponse = await axios.get(
            `${MUX_BASE_URL}/video/v1/uploads/${uploadId}`,
            {
              auth: {
                username: MUX_TOKEN_ID,
                password: MUX_TOKEN_SECRET,
              },
            }
          );
  
          if (statusResponse.data.data.asset_id) {
            assetId = statusResponse.data.data.asset_id;
            assetReady = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        } catch (error) {
          console.error('Error checking upload status:', error);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
  
      if (!assetReady) {
        throw new Error('Asset processing timed out');
      }
  
      Alert.alert('Success', 'Video uploaded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
  
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload video';
      if (error.response) {
        errorMessage = error.response.data?.error?.message || 
          `Server responded with ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || 'Upload setup failed';
      }
  
      Alert.alert(
        'Upload Failed', 
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => !isUploading && router.back()} 
          style={styles.backButton}
          disabled={isUploading}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
      </View>

      <View style={styles.content}>
        {video ? (
          <View style={styles.videoPreviewContainer}>
            <Video
              source={{ uri: video.uri }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
              isLooping={false}
            />
            <View style={styles.videoInfo}>
              <Text style={styles.videoName} numberOfLines={1}>
                {video.name}
              </Text>
              <Text style={styles.videoSize}>
                {(video.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.changeVideoButton}
              onPress={pickVideo}
              disabled={isUploading}
            >
              <Text style={styles.changeVideoText}>Change Video</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity 
              style={styles.uploadOptionButton}
              onPress={pickVideo}
              disabled={isUploading}
            >
              <MaterialIcons name="video-library" size={40} color="#6C63FF" />
              <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.uploadOptionButton}
              onPress={pickDocument}
              disabled={isUploading}
            >
              <Feather name="folder" size={40} color="#6C63FF" />
              <Text style={styles.uploadOptionText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter video title"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
            editable={!isUploading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter video description"
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!isUploading}
          />
        </View>

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading: {uploadProgress}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress}%` }
                ]}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!video || isUploading) && styles.uploadButtonDisabled
          ]}
          onPress={uploadVideo}
          disabled={!video || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  uploadOptionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    width: '45%',
  },
  uploadOptionText: {
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  videoPreviewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: 'black',
    borderRadius: 10,
  },
  videoInfo: {
    width: '100%',
    padding: 10,
  },
  videoName: {
    color: 'white',
    fontSize: 14,
  },
  videoSize: {
    color: '#888',
    fontSize: 12,
  },
  changeVideoButton: {
    padding: 10,
  },
  changeVideoText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: 'white',
    marginBottom: 5,
  },
  progressBar: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
  },
  uploadButton: {
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VideoUploadScreen;