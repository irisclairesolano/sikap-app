import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import Button from '../../components/common/Button';
import CustomInput from '../../components/common/Input';
import { profileApi } from '../../api/profile';

// Colors for avatars
const AVATAR_COLORS = [colors.sky, colors.butter, colors.mint];

export const AddCharacterReferencesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();
  
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const references = profile?.worker_profile?.character_references || [];
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => profileApi.addReference({
      name,
      phone,
      relationship,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setName('');
      setPhone('');
      setRelationship('');
      setIsAdding(false);
    },
    onError: (err) => {
      console.error('Failed to add reference', err);
    }
  });

  const showForm = isAdding || references.length === 0;

  const getInitials = (n: string) => {
    return n.split(' ').map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.appBarBadge}>
          <Text style={styles.appBarBadgeText}>References</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          Three people{'\n'}who can <Text style={styles.titleAccent}>vouch.</Text>
        </Text>

        <View style={styles.infoBanner}>
          <Ionicons name="lock-closed" size={18} color={colors.mintDeep} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>Reference contacts stay hidden</Text> until an employer formally shortlists you.
          </Text>
        </View>

        {!showForm && (
          <>
            <Text style={styles.sectionHeader}>References · {references.length} of 3</Text>

            <View style={styles.listContainer}>
              {references.map((ref, index) => (
                <View key={ref.id} style={styles.refCard}>
                  <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                    <Text style={styles.avatarText}>{getInitials(ref.name)}</Text>
                  </View>
                  <View style={styles.refDetails}>
                    <Text style={styles.refName}>{ref.name}</Text>
                    <Text style={styles.refRole}>{ref.relationship} · {ref.phone}</Text>
                  </View>
                </View>
              ))}
            </View>

            {references.length < 3 && (
              <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={() => setIsAdding(true)}>
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={22} color={colors.white} />
                </View>
                <Text style={styles.addTitle}>Add another reference</Text>
                <Text style={styles.addSubtitle}>{3 - references.length} slot{3 - references.length > 1 ? 's' : ''} remaining</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {showForm && (
          <View style={{ marginTop: 32, gap: 16 }}>
            <CustomInput
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="E.g. Juan Reyes"
              icon="person-outline"
            />
            <CustomInput
              label="Relationship"
              value={relationship}
              onChangeText={setRelationship}
              placeholder="E.g. Former employer"
              icon="people-outline"
            />
            <CustomInput
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="E.g. 09123456789"
              icon="call-outline"
              keyboardType="phone-pad"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {showForm ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {references.length > 0 && (
              <Button 
                label="Cancel" 
                size="lg"
                variant="outline"
                onPress={() => setIsAdding(false)}
                style={{ flex: 1 }}
              />
            )}
            <Button 
              label={saveMutation.isPending ? "Saving..." : "Save reference"} 
              size="lg"
              style={{ flex: references.length > 0 ? 2 : 1 }}
              loading={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
              disabled={!name || !phone || !relationship}
            />
          </View>
        ) : (
          <Button 
            label="Done" 
            size="lg"
            variant="soft"
            fullWidth 
            onPress={() => navigation.goBack()}
          />
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  appBarBadge: {
    backgroundColor: colors.paperBright,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  appBarBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.8,
  },
  titleAccent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mintDeep,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  refDetails: {
    flex: 1,
  },
  refName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  refRole: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  addButton: {
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.peachBright,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 4,
  },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  addSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primaryDark,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.paper,
  },
});

export default AddCharacterReferencesScreen;
