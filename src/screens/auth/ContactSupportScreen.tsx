import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { apiClient } from '../../api/client';
import { colors, fonts } from '../../theme';
import { useAlert } from '../../contexts/AlertContext';

const ContactSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiClient('/support', {
        method: 'POST',
        body: JSON.stringify({ subject, message }),
      });
    },
    onSuccess: () => {
      showAlert(
        'Message Sent',
        'Your support ticket has been created. Our team will email you back shortly.',
      );
      navigation.goBack();
    },
    onError: (err: any) => {
      showAlert('Error', err.message || 'Failed to send message. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      showAlert('Incomplete', 'Please fill in both the subject and the message.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
          {/* App Bar */}
          <View style={styles.appBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={26} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="chatbubbles-outline" size={42} color={colors.white} />
            </View>

            <Text style={styles.title}>
              Contact <Text style={styles.titleItalic}>Support</Text>
            </Text>

            <Text style={styles.body}>
              Having trouble? Send us a message and our support team will get back to you via email.
            </Text>

            <View style={styles.formGroup}>
              <Input
                placeholder="What do you need help with?"
                value={subject}
                onChangeText={setSubject}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.formGroup}>
              <Input
                placeholder="Describe your issue in detail..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.footer}>
              <Button
                label={submitMutation.isPending ? 'Sending...' : 'Send Message'}
                variant="primary"
                fullWidth
                size="lg"
                onPress={handleSubmit}
                disabled={submitMutation.isPending || !subject.trim() || !message.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 10,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.75,
    marginBottom: 8,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    lineHeight: 22,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
  },
});

export default ContactSupportScreen;
