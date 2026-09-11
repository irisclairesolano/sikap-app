import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Message } from '../../types';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const [modalVisible, setModalVisible] = useState(false);

  if (message.message_type === 'action_card') {
    return null;
  }

  if (message.message_type === 'system') {
    return <Text style={styles.systemText}>{message.body}</Text>;
  }

  const isImage = message.message_type === 'image';
  const isPending = message.id < 0;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        isPending && { opacity: 0.8 },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          isImage && styles.imageBubble,
        ]}
      >
        {isImage ? (
          <View style={styles.imageWrapper}>
            <Pressable onPress={() => !isPending && setModalVisible(true)}>
              <Image
                source={{ uri: (message.image_url || message.body) ?? undefined }}
                style={styles.image}
                resizeMode="cover"
              />
              {isPending && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              )}
            </Pressable>
            <Modal visible={modalVisible} transparent={true} animationType="fade">
              <SafeAreaView style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={26} color={colors.white} />
                </TouchableOpacity>
                <Image
                  source={{ uri: (message.image_url || message.body) ?? undefined }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </SafeAreaView>
            </Modal>
          </View>
        ) : (
          <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}>
            {message.body}
          </Text>
        )}
      </View>
      <View style={[styles.footer, isOwnMessage ? styles.ownFooter : styles.otherFooter]}>
        {isPending ? (
          <View style={styles.pendingRow}>
            <Ionicons name="time-outline" size={10} color={colors.inkLight} />
            <Text style={styles.pendingText}>Sending...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
            {isOwnMessage && (
              <Text style={[styles.receipt, message.read_at ? styles.receiptRead : null]}>
                {message.read_at ? '✓✓' : '✓'}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  systemText: {
    fontFamily: fonts.body,
    color: colors.inkMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 24,
  },
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: 'column',
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.ink,
  },
  imageBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 220,
    height: 180,
    borderRadius: 14,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '94%',
    height: '80%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkLight,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pendingText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkLight,
    fontStyle: 'italic',
  },
  receipt: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkLight,
  },
  receiptRead: {
    color: '#3B82F6',
  },
});

export default MessageBubble;
