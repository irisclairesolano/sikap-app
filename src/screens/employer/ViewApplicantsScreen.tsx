import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import Button from '../../components/common/Button';

// Dummy data
const JOB = { title: 'Carpenter wanted', location: 'Bulan', pay: 600, slots: 2 };

const APPLICANTS = [
  { id: 1, name: 'Maria Santos', initials: 'M', verified: true, location: 'San Rafael, Bulan', distance: '2.1km', rating: 4.8, hires: 12, color: colors.peach },
  { id: 2, name: 'Jose Bernardo', initials: 'J', verified: true, location: 'Aquino, Bulan', distance: '4km', rating: 4.6, hires: 22, color: colors.mint },
  { id: 3, name: 'Antonio Cruz', initials: 'A', verified: false, location: 'San Vicente', distance: '6km', rating: 4.2, hires: 6, color: colors.butter },
];

const FILTERS = ['All · 5', 'New', 'Shortlisted', 'Hired'];

export const ViewApplicantsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.appBarBadge}>
          <Text style={styles.appBarBadgeText}>Review applicants</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primaryDark} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            <Text style={{ fontFamily: fonts.bodyBold, color: colors.primaryDark }}>Privacy Shield is active.</Text> Only public profile data is visible right now. Shortlist a worker to see their contact info.
          </Text>
        </View>

        <View style={styles.jobSummary}>
          <Text style={styles.jobTitle}>{JOB.title}</Text>
          <Text style={styles.jobSubtitle}>{JOB.location} · ₱{JOB.pay}/day · {JOB.slots} slots</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.chip, activeFilter === filter && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          {APPLICANTS.map((app, index) => (
            <TouchableOpacity 
              key={app.id} 
              style={styles.applicantCard}
              onPress={() => navigation.navigate('ApplicantDetail', { 
                applicantId: app.id, 
                applicantName: app.name, 
                jobTitle: JOB.title, 
                status: 'pending' 
              })}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: app.color }]}>
                  <Text style={styles.avatarText}>{app.initials}</Text>
                </View>
                <View style={styles.applicantDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.applicantName}>{app.name}</Text>
                    {app.verified && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.mintDeep} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.applicantLocation}>{app.location} · {app.distance}</Text>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={12} color={colors.gold} />
                      <Text style={styles.statNum}>{app.rating}</Text>
                    </View>
                    <Text style={styles.statText}><Text style={{fontFamily: fonts.numericBold}}>{app.hires}</Text> hires</Text>
                  </View>
                </View>
              </View>

              {/* Show primary action only on the first applicant for the mockup */}
              {index === 0 && (
                <Button 
                  label="Send job request" 
                  onPress={() => navigation.navigate('SendRequest', { id: app.id })}
                  style={{ marginTop: 12 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
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
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.peach,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 8,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  jobSummary: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  jobSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.ink,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.white,
  },
  listContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    gap: 10,
  },
  applicantCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  applicantDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  applicantLocation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: fonts.numericBold,
    fontSize: 13,
    color: colors.ink,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
});

export default ViewApplicantsScreen;
