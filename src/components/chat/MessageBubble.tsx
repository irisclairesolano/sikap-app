import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, TouchableOpacity } from 'react-native';
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

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        {isImage ? (
          <View>
            <Pressable onPress={() => setModalVisible(true)}>
              <Image
                source={{ uri: (message.image_url || message.body) ?? undefined }}
                style={styles.image}
              />
            </Pressable>
            <Modal visible={modalVisible} transparent={true} animationType="fade">
              <SafeAreaView style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={30} color={colors.white} />
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
        <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
        {isOwnMessage && <Text style={styles.receipt}>{message.read_at ? '✓✓' : '✓'}</Text>}
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
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullImage: {
    width: '100%',
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
  receipt: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkLight,
  },
});

export default MessageBubble;
