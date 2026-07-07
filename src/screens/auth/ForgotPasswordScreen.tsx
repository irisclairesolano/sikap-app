import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>
          Forgot{'\n'}
          <Text style={styles.titleItalic}>password?</Text>
        </Text>

        <Text style={styles.body}>
          Password reset is currently disabled. Please contact support or use another login method
          if you've lost your credentials.
        </Text>

        <View style={styles.footer}>
          <Button
            label="Back to login"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.peach,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.9,
    marginBottom: 12,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    marginTop: 12,
  },
});

export default ForgotPasswordScreen;
