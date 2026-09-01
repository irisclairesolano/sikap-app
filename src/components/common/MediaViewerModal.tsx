import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

interface MediaViewerModalProps {
  visible: boolean;
  media: { type: 'photo' | 'video'; url: string } | null;
  onClose: () => void;
}

const VideoPlayerContent: React.FC<{ url: string }> = ({ url }) => {
  const safeUrl = typeof url === 'string' ? url.trim() : '';
  const player = useVideoPlayer(safeUrl, (p) => {
    p.loop = true;
    p.play();
  });

  if (!safeUrl) return null;

  return (
    <VideoView
      style={styles.fullscreenVideo}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ visible, media, onClose }) => {
  if (!media) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>
        {/* Top bar with X close button */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {media.type === 'photo' ? 'Photo Preview' : 'Video Preview'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Media content */}
        <View style={styles.content}>
          {media.type === 'photo' ? (
            <Image
              cachePolicy="memory-disk"
              source={{ uri: media.url }}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
          ) : (
            <VideoPlayerContent url={media.url} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.white,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '80%',
  },
});

export default MediaViewerModal;
