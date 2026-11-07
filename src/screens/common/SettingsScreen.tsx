import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOnboardingTutorial } from '../../contexts/OnboardingTutorialContext';
import { useAuth } from '../../hooks/useAuth';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';

// ─── Static content modal ────────────────────────────────────────────────────

type ContentSection = { heading?: string; body: string };

const ContentModal = ({
  visible,
  onClose,
  icon,
  iconColor,
  iconBg,
  title,
  sections,
  closeLabel = 'Close',
}: {
  visible: boolean;
  onClose: () => void;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  sections: ContentSection[];
  closeLabel?: string;
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cStyles.overlay}>
        <View style={[cStyles.sheet, { paddingBottom: bottomInset + 20 }]}>
          {/* Drag handle */}
          <View style={cStyles.handle} />

          {/* Header */}
          <View style={cStyles.sheetHeader}>
            <View style={[cStyles.iconCircle, { backgroundColor: iconBg }]}>
              <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <Text style={cStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={cStyles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cStyles.body}>
            {sections.map((s, i) => (
              <View key={i} style={{ marginBottom: 18 }}>
                {s.heading ? <Text style={cStyles.heading}>{s.heading}</Text> : null}
                <Text style={cStyles.bodyText}>{s.body}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={cStyles.closeFullBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={cStyles.closeFullBtnText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const cStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paperBright,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingBottom: 8 },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  closeFullBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
});

// ─── Content data (English & Simplified Tagalog) ──────────────────────────────

const HELP_SECTIONS_EN: ContentSection[] = [
  {
    heading: '👋 Welcome to SIKAP Help Center',
    body: 'SIKAP connects local informal-sector workers with household and micro-business employers across all 14 municipalities and 1 city of Sorsogon. Here are answers to common questions about using the app.',
  },
  {
    heading: 'Getting Started & ID Verification',
    body: '1. Register with your email, phone number, birth date (18 years old and above), municipality, and barangay.\n2. Enter the 6-digit verification code (OTP) sent to your email.\n3. Upload your verification documents:\n• Workers: Front and back of a valid ID, plus a clear selfie holding your ID.\n• Employers: Representative valid ID, and optionally business documents or proof of household/establishment.\n\nOur admin team reviews submissions to keep the community safe.',
  },
  {
    heading: 'Finding & Applying for Jobs',
    body: 'Browse local job posts in the Find tab. You can filter by job category, your barangay, your municipality, or anywhere in Sorsogon. Tap a job post to view full details and send an application.',
  },
  {
    heading: 'Hiring Process & 4-Stage Privacy',
    body: 'SIKAP protects your contact details through a 4-stage progressive disclosure flow:\n\n1. Stage 1 (Applied / Pending) — Only your name, barangay, skills, work experience, and rating are visible to the employer.\n2. Stage 2 (Shortlisted / Job Request) — When the employer selects your application and sends a Job Request, your character references and mobile number are unlocked, and in-app chat opens to discuss pay and job details.\n3. Stage 3 (Hire Confirmed) — The employer sets the agreed pay rate and reserves a slot for you. You then decide whether to accept or decline the offer.\n4. Stage 4 (Hired / Accepted) — Once you accept the offer, your emergency contact is unlocked to the employer for your safety while working.',
  },
  {
    heading: 'In-App Messaging & Action Cards',
    body: 'You can chat directly to discuss job details once shortlisted. Interactive action cards inside the chat make it easy to complete each step of the application and hiring process.',
  },
  {
    heading: 'Ratings & Reviews (7-Day Window)',
    body: 'Once a job is marked Completed, both the worker and employer have 7 days to leave a rating and review. Your feedback helps other SIKAP users know who is reliable and trustworthy to work with.',
  },
  {
    heading: 'Switching Between Worker & Employer',
    body: 'If you have both a Worker and Employer account, you can switch between the two modes anytime using the switch option in Settings. Worker and Employer ratings are tracked separately.',
  },
  {
    heading: 'Reporting, Blocking & Support',
    body: 'If you see suspicious activity or a user violating community rules, you can report or block them. If you need help with your account, check the Support Tickets option in Settings.',
  },
];

const HELP_SECTIONS_TL: ContentSection[] = [
  {
    heading: '👋 Welcome sa SIKAP Help Center',
    body: 'Dito mo makikita ang mga sagot sa mga karaniwang tanong tungkol sa SIKAP. Tinutulungan ng app ang mga manggagawa at employer sa Sorsogon na makahanap ng trabaho at makahanap ng mga taong puwedeng kunin sa trabaho.',
  },
  {
    heading: 'Paano Magsimula at Mag-verify ng ID',
    body: '1. Gumawa ng account gamit ang iyong email, cellphone number, birthday (dapat ay 18 taong gulang pataas), bayan, at barangay.\n2. Ilagay ang 6-digit OTP na ipapadala sa email mo.\n3. I-upload ang mga kailangang dokumento:\n• Worker: Harap at likod ng valid ID, pati selfie habang hawak mo ang iyong ID.\n• Employer: Valid ID ng kinatawan. Maaari ring mag-upload ng business documents o patunay ng sambahayan kung mayroon.',
  },
  {
    heading: 'Paano Maghanap at Mag-apply ng Trabaho',
    body: 'Pumunta sa Find tab para maghanap ng mga available na trabaho. Puwede mong i-filter ang mga ito ayon sa uri ng trabaho, barangay mo, bayan mo, o kahit saan sa Sorsogon. Pindutin ang job post para makita ang buong detalye. Kung interesado ka, puwede ka nang mag-apply.',
  },
  {
    heading: 'Paano ang Proseso ng Pagkuha sa Trabaho',
    body: '1. Stage 1 (Nag-apply): Pangalan, barangay, skills, karanasan sa trabaho, at rating mo pa lang ang makikita ng employer.\n2. Stage 2 (Napili para sa Trabaho): Kapag pinili ka ng employer at nagpadala ng Job Request, makikita na niya ang iyong character references at cellphone number. Puwede na rin kayong mag-chat para pag-usapan ang bayad at iba pang detalye.\n3. Stage 3 (Kumpirmado ang Alok): Ilalagay ng employer ang napagkasunduang bayad at irereserba ang slot para sa iyo. Ikaw naman ang magpapasya kung tatanggapin o tatanggihan mo ang alok.\n4. Stage 4 (Tanggap na sa Trabaho): Kapag tinanggap mo ang alok, makikita na ng employer ang emergency contact mo para sa kaligtasan mo habang nagtatrabaho.',
  },
  {
    heading: 'Paggamit ng Chat at Action Cards',
    body: 'Puwede kayong mag-chat para direktang pag-usapan ang mga detalye ng trabaho. May mga action card din na magagamit para mas madali mong magawa ang mga kailangang hakbang sa application at hiring process.',
  },
  {
    heading: 'Ratings at Reviews (7 Araw)',
    body: 'Pagkatapos ng trabaho, maaari kang magbigay ng rating at review sa loob ng 7 araw. Makakatulong ang feedback mo para malaman ng ibang users kung maayos at mapagkakatiwalaan ang kanilang makakatrabaho.',
  },
  {
    heading: 'Paglipat sa Worker at Employer Mode',
    body: 'Kung mayroon kang Worker at Employer account, puwede kang lumipat sa dalawang mode gamit ang switch option sa app.',
  },
  {
    heading: 'Paano Mag-report, Mag-block, at Humingi ng Tulong',
    body: 'Kung may makita kang kahina-hinalang activity o user na lumalabag sa mga patakaran, puwede mo silang i-report o i-block. Kung may problema ka sa paggamit ng app, tingnan ang available na support options para makahingi ng tulong.',
  },
];

const TERMS_SECTIONS_EN: ContentSection[] = [
  {
    heading: 'Terms of Service',
    body: 'Last updated: November 2026\n\nBy creating an account or using SIKAP, you agree to follow these Terms of Service. Please read them carefully.',
  },
  {
    heading: '1. Eligibility & Age Requirement (18+)',
    body: 'To register and use SIKAP, you must be at least 18 years old and reside or operate within the Province of Sorsogon.',
  },
  {
    heading: '2. About SIKAP',
    body: 'SIKAP is a localized job-matching platform connecting informal-sector workers and employers in Sorsogon. SIKAP provides tools for job posting, application tracking, in-app negotiation, and identity verification, but is not an employment agency or direct employer.',
  },
  {
    heading: '3. Account Registration & Verification',
    body: 'You agree to provide truthful, accurate information when registering and to verify your email via OTP. To access full platform features, workers must submit a valid ID (front and back) and selfie holding the ID, while employers must submit a representative valid ID and optional supporting business or household proof. Sharing accounts or using fake documents will result in permanent suspension.',
  },
  {
    heading: '4. Community Rules & Conduct (2-Tier Profanity & Anti-Fraud)',
    body: 'To keep SIKAP safe and respectful, you agree not to:\n• Post fake, illegal, or misleading job listings or profile information\n• Harass, abuse, or use profane language in chat, job posts, or reviews\n• Ask for application fees, deposits, or money transfers\n• Bypass the platform’s progressive contact disclosure rules\n\nSIKAP uses automated 2-tier profanity filters and admin moderation. Violations may result in content removal, temporary suspension, or a permanent ban.',
  },
  {
    heading: '5. Job Offers, DOLE Region V Wage Guidance & Payments',
    body: 'Employers and workers agree on the scope of work and compensation before confirming a hire. While SIKAP displays Region V (Bicol) DOLE minimum wage reference guides, final pay rates are agreed upon by both users. SIKAP does not process payments or collect commissions, and is not liable for offline payment disputes.',
  },
  {
    heading: '6. Dual-Role Usage',
    body: 'Users may switch between Worker and Employer modes within the same account. However, you may not apply to your own job postings or manipulate ratings and reviews.',
  },
  {
    heading: '7. Reviews & Bayesian Reputation (7-Day Window)',
    body: 'Reviews must reflect genuine work experiences from completed jobs within the 7-day rating window. Dishonest, abusive, or retaliatory reviews may be moderated by administrators.',
  },
  {
    heading: '8. Account Deletion & Suspension',
    body: 'You may delete your account in Settings as long as you do not have active hired jobs in progress. SIKAP reserves the right to suspend or permanently ban accounts involved in fraud, harassment, or repeated policy violations.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'SIKAP is provided "as is" as a community matching tool. We do not guarantee job placement, worker performance, or workplace safety, and are not liable for any damages arising from offline work arrangements between users.',
  },
  {
    heading: '10. Governing Law & Contact',
    body: 'These Terms are governed by the laws of the Republic of the Philippines. If you have questions or concerns, please reach out via Settings > Support Tickets.',
  },
];

const TERMS_SECTIONS_TL: ContentSection[] = [
  {
    heading: 'Mga Tuntunin sa Paggamit',
    body: 'Huling na-update: Nobyembre 2026\n\nSa paggawa ng account at paggamit ng SIKAP, sumasang-ayon ka na susundin ang mga patakarang ito. Pakibasa ito nang mabuti.',
  },
  {
    heading: '1. Sino ang Puwedeng Gumamit ng SIKAP (18 Taong Gulang Pataas)',
    body: 'Para makagawa ng account at magamit ang SIKAP, dapat ay 18 taong gulang ka pataas at nakatira o naghahanapbuhay sa Probinsya ng Sorsogon.',
  },
  {
    heading: '2. Tungkol sa SIKAP',
    body: 'Ang SIKAP ay isang app na tumutulong sa mga manggagawa at employer sa Sorsogon na magkahanap ng trabaho at makakuha ng mapagkakatiwalaang gagawa. Nagbibigay ang app ng paraan para mag-post ng trabaho, mag-apply, mag-chat, at mag-verify ng ID, pero hindi agency o direktang employer ang SIKAP.',
  },
  {
    heading: '3. Paggawa ng Account at Pag-verify ng ID',
    body: 'Sumasang-ayon kang magbigay ng totoo at tamang impormasyon sa pag-register at i-verify ang email mo gamit ang 6-digit OTP. Para magamit nang buo ang app, kailangang mag-upload ng Worker ng harap at likod ng valid ID pati selfie habang hawak ang ID, at mag-upload naman ang Employer ng valid ID ng kinatawan (at business documents o patunay ng sambahayan kung mayroon). Ang paggamit ng pekeng ID o impormasyon ay magreresulta sa pagka-ban ng account.',
  },
  {
    heading: '4. Mga Patakaran sa Paggamit ng SIKAP',
    body: 'Para manatiling ligtas at maayos ang paggamit ng SIKAP, bawal ang mga sumusunod:\n• Mag-post ng pekeng job post o maling impormasyon sa profile\n• Manloko, mang-away, o gumamit ng bastos na salita sa chat, job post, o review\n• Maningil ng application fee, deposit, o humingi ng pera bago magsimula ang trabaho\n• Pilitin ang ibang user na ibigay agad ang pribadong contact details nang hindi dumadaan sa tamang proseso ng app\n\nMay automatic filter sa masasama o bastos na salita at admin team ang SIKAP na nagbabantay. Ang lalabag ay puwedeng masuspinde o ma-ban nang permanente.',
  },
  {
    heading: '5. Mga Alok sa Trabaho, Gabay sa Sahod ng DOLE Region V, at Pagbabayad',
    body: 'Ang employer at worker ang nagkakasundo sa detalye ng trabaho at halaga ng bayad bago kumpirmahin ang pagkuha. Nagpapakita ang SIKAP ng gabay sa minimum wage mula sa DOLE Region V, pero direktang nagkakasundo at nagbabayaran ang employer at worker. Hindi dumadaan sa SIKAP ang bayad o sahod.',
  },
  {
    heading: '6. Paggamit ng Worker at Employer Mode',
    body: 'Puwede kang lumipat sa Worker at Employer mode gamit ang switch option sa app. Gayunpaman, bawal mag-apply sa sarili mong job post o dayain ang mga rating at review.',
  },
  {
    heading: '7. Ratings at Reviews (7 Araw)',
    body: 'Ang mga rating at review ay dapat batay sa totoong karanasan sa natapos na trabaho at puwedeng ibigay sa loob ng 7 araw. Puwedeng alisin ng admin ang mga hindi totoo o mapanirang review.',
  },
  {
    heading: '8. Pag-delete at Pagsuspinde ng Account',
    body: 'Puwede mong i-delete ang account mo sa Settings basta wala kang kasalukuyang trabahong hindi pa tapos. May karapatan din ang SIKAP na isuspinde o i-ban ang mga account na lumalabag sa mga patakaran ng app.',
  },
  {
    heading: '9. Hangganan ng Pananagutan',
    body: 'Ang SIKAP ay tulay lamang para magkausap at magkatrabaho ang employer at worker. Hindi namin ginagarantiya na agad kang matatanggap sa trabaho, at hindi kami mananagot sa anumang hindi pagkakaunawaan o pangyayari sa labas ng app.',
  },
  {
    heading: '10. Mga Batas na Sinusunod at Contact Information',
    body: 'Ang mga patakarang ito ay sumusunod sa mga batas ng Republika ng Pilipinas. Kung may tanong o kailangan ng tulong, magpadala lang ng mensahe sa Settings > Support Tickets.',
  },
];

const PRIVACY_SECTIONS_EN: ContentSection[] = [
  {
    heading: 'Privacy Policy',
    body: 'Last updated: November 2026\n\nSIKAP values your privacy and protects your personal data in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
  },
  {
    heading: '1. Information We Collect',
    body: 'When you use SIKAP, we collect:\n• Registration details: full name, email address, mobile number, birth date (18+), municipality, and barangay in Sorsogon\n• Profile information: skills, work experience, character references (up to 3), emergency contact, household/business details, and profile photo\n• Verification documents: valid government IDs (front and back), selfies holding the ID, and optional business or household proof documents\n• App activity: job posts, applications, in-app chat messages, ratings, reviews, and support tickets\n• Device data: Expo push notification tokens for real-time updates',
  },
  {
    heading: '2. How We Use Your Data',
    body: 'We use your information strictly to:\n• Verify your identity and maintain a trusted local community\n• Match workers with nearby jobs in their barangay, municipality, and across Sorsogon\n• Facilitate in-app chat, action cards, job offers, and ratings\n• Send important email OTPs and app notifications about your applications or jobs\n• Generate anonymized, aggregate labor-market statistics for Sorsogon',
  },
  {
    heading: '3. 4-Stage Progressive Data Disclosure',
    body: 'SIKAP protects your personal details by unlocking information only as your application progresses:\n• Stage 1 (Applied / Pending): Only your name, barangay, skills, work experience, and rating are visible to the employer.\n• Stage 2 (Shortlisted / Job Request): When the employer selects your application and sends a Job Request, your character references and mobile number become visible, and you can chat in the app.\n• Stage 3 (Hire Confirmed): The employer sets the agreed pay rate and reserves a slot for you while you decide whether to accept or decline the offer.\n• Stage 4 (Hired / Accepted): Once you accept the offer, your emergency contact becomes visible to the employer for your safety while working.\n\nWe never sell or rent your personal data to advertisers or third parties.',
  },
  {
    heading: '4. Protection of ID Documents & Character References (Private Bucket & Signed URLs)',
    body: 'Uploaded IDs, selfies, and supporting documents are stored in a private cloud bucket and can only be viewed by authorized SIKAP administrators through temporary signed links. They are never shown to other users. Character references and emergency contacts are protected and only disclosed at the appropriate hiring stage.',
  },
  {
    heading: '5. Data Retention & Account Deletion',
    body: 'We keep your data while your account remains active. If you delete your account in Settings, your profile and personal information are removed from active access, while necessary security or moderation records are retained only as required by law.',
  },
  {
    heading: '6. Security Measures (HTTPS, SHA-256 OTPs, RBAC)',
    body: 'We protect your account using HTTPS encryption, hashed passwords and SHA-256 OTP verification codes, secure token storage on your phone, and strict role-based access controls.',
  },
  {
    heading: '7. Your Data Privacy Rights (RA 10173)',
    body: 'Under the Data Privacy Act of 2012 (RA 10173), you have the right to:\n• Be informed about how your data is collected and used\n• Access and update your profile information\n• Withdraw consent or delete your account\n• Report privacy concerns to our team via Settings > Support Tickets',
  },
];

const PRIVACY_SECTIONS_TL: ContentSection[] = [
  {
    heading: 'Patakaran sa Privacy',
    body: 'Huling na-update: Nobyembre 2026\n\nPinapahalagahan ng SIKAP ang iyong privacy at pinoprotektahan ang personal mong impormasyon alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173).',
  },
  {
    heading: '1. Anong Impormasyon ang Kinukuha Namin',
    body: 'Kapag ginagamit mo ang SIKAP, kinukuha namin ang mga sumusunod na impormasyon:\n• Detalye sa Paggawa ng Account: buong pangalan, email, cellphone number, birthday (dapat ay 18 taong gulang pataas), bayan, at barangay sa Sorsogon\n• Detalye sa Profile: skills, karanasan sa trabaho, character references, emergency contact, detalye ng negosyo o sambahayan, at profile picture\n• Dokumento sa Verification: harap at likod ng valid ID, selfie habang hawak ang ID, at business documents o patunay ng sambahayan kung mayroon\n• Activity sa App: mga job post, application, pag-uusap sa chat, rating, review, at support tickets\n• Impormasyon ng Device: notification token para makatanggap ka ng notifications sa cellphone mo',
  },
  {
    heading: '2. Paano Namin Ginagamit ang Impormasyon Mo',
    body: 'Ginagamit lang namin ang impormasyon mo para:\n• Ma-verify ang ID at account mo para siguradong ligtas ang mga gumagamit ng SIKAP\n• Matulungan ang mga worker at employer sa Sorsogon na magkahanap ng trabaho at makakuha ng gagawa\n• Magamit mo nang maayos ang chat, action cards, pagpapadala ng alok sa trabaho, at pagbibigay ng rating at review\n• Mapadalhan ka ng 6-digit OTP sa email at notifications tungkol sa application o job post mo\n• Makagawa ng pangkalahatang datos tungkol sa mga trabaho sa Sorsogon nang hindi inilalabas ang personal mong pangalan o detalye',
  },
  {
    heading: '3. 4 na Yugto ng Pagpapakita ng Impormasyon',
    body: 'Hindi agad ipinapakita ng SIKAP ang lahat ng personal mong impormasyon. Hakbang-hakbang itong nakikita habang umuusad ang application mo:\n• Stage 1 (Nag-apply): Pangalan, barangay, skills, karanasan sa trabaho, at rating mo pa lang ang makikita ng employer.\n• Stage 2 (Napili para sa Trabaho): Kapag pinili ka ng employer at nagpadala ng Job Request, makikita na niya ang iyong character references at cellphone number. Puwede na rin kayong mag-chat para pag-usapan ang bayad at iba pang detalye.\n• Stage 3 (Kumpirmado ang Alok): Ilalagay ng employer ang napagkasunduang bayad at irereserba ang slot para sa iyo habang nagpapasya ka kung tatanggapin o tatanggihan mo ang alok.\n• Stage 4 (Tanggap na sa Trabaho): Kapag tinanggap mo ang alok, makikita na ng employer ang emergency contact mo para sa kaligtasan mo habang nagtatrabaho.\n\nHindi namin kailanman ibinebenta ang personal mong impormasyon sa ibang tao o kumpanya.',
  },
  {
    heading: '4. Paano Namin Pinoprotektahan ang ID at Character References Mo',
    body: 'Ang mga in-upload mong ID, selfie, at iba pang dokumento ay nakatago sa pribadong storage at tanging mga awtorisadong admin lang ng SIKAP ang puwedeng tumingin gamit ang pansamantalang secure link para sa verification. Hindi ito kailanman ipinapakita sa ibang users. Ang iyong character references at emergency contact ay protektado rin at makikita lang ng employer sa tamang stage ng pagkuha sa trabaho.',
  },
  {
    heading: '5. Gaano Katagal Namin Itinatago ang Impormasyon Mo at Paano Ito Buburahin',
    body: 'Itinatago namin ang impormasyon mo habang aktibo ang iyong account. Kapag pinili mong i-delete ang account mo sa Settings, aalisin na sa app ang iyong profile at personal na detalye, maliban sa mga tala na kailangang itabi para sa seguridad at pagsunod sa batas.',
  },
  {
    heading: '6. Paano Namin Pinoprotektahan ang Account Mo',
    body: 'Pinoprotektahan namin ang account mo gamit ang ligtas na koneksyon (HTTPS), naka-encrypt na password at OTP, ligtas na pagtatago ng login token sa cellphone mo, at mahigpit na patakaran kung sino lang ang puwedeng makakita ng iyong impormasyon.',
  },
  {
    heading: '7. Mga Karapatan Mo sa Ilalim ng Data Privacy Act (RA 10173)',
    body: 'Sa ilalim ng Data Privacy Act of 2012 (RA 10173), may karapatan kang:\n• Malaman kung paano kinukuha at ginagamit ang impormasyon mo\n• Tingnan at i-update ang mga detalye sa iyong profile\n• Bawiin ang pahintulot mo o i-delete ang iyong account\n• Magtanong o mag-report tungkol sa iyong privacy sa pamamagitan ng support options sa app',
  },
];

const DELETE_REASONS_EN = [
  'Found work / hired someone elsewhere',
  'Not using the app anymore',
  'Privacy or security concerns',
  'Technical difficulties or app bugs',
  'Other reason',
];

const DELETE_REASONS_TL = [
  'Nakahanap na ng trabaho o manggagawa sa iba',
  'Hindi ko na ginagamit ang app',
  'May alalahanin sa privacy o seguridad',
  'May problema o bug sa paggamit ng app',
  'Iba pang dahilan',
];

const SettingRow = ({
  icon,
  title,
  subtitle,
  type = 'nav',
  value,
  onToggle,
  onPress,
  isDestructive = false,
}: any) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={type === 'nav' ? onPress : undefined}
    disabled={type !== 'nav'}
  >
    <View style={styles.settingRowLeft}>
      <Ionicons name={icon} size={22} color={isDestructive ? colors.error : colors.ink} />
      <View>
        <Text style={[styles.settingRowTitle, isDestructive && { color: colors.error }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {type === 'nav' && <Ionicons name="chevron-forward" size={20} color={colors.inkLight} />}
    {type === 'toggle' && (
      <Switch
        trackColor={{ false: colors.inkFaint, true: colors.mint }}
        thumbColor={colors.paperBright}
        onValueChange={onToggle}
        value={value}
      />
    )}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);
  const { showAlert } = useAlert();
  const { language, setLanguage, t } = useLanguage();

  const isTagalog = language === 'tl';
  const deleteReasons = isTagalog ? DELETE_REASONS_TL : DELETE_REASONS_EN;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<'en' | 'tl'>(language);
  const [selectedReason, setSelectedReason] = useState<string>(deleteReasons[0]);
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  React.useEffect(() => {
    setPendingLanguage(language);
  }, [language]);

  const { user, userRole, switchRole } = useAuth();
  const { startTutorial } = useOnboardingTutorial();

  const handleReplayTutorial = () => {
    const activeRole = userRole === 'employer' ? 'employer' : 'worker';
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    setTimeout(() => {
      startTutorial(activeRole, { isReplay: true, userId: user?.id });
    }, 80);
  };

  const handleLogout = () => {
    showAlert(t('log_out'), t('confirm_logout_msg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('log_out'),
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_profile');
          queryClient.clear();
          notifyAuthChanged();
        },
      },
    ]);
  };

  const executeAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      const isOther = selectedReason === 'Other reason' || selectedReason === 'Iba pang dahilan';
      const fullReason =
        isOther && customReasonDetails.trim()
          ? `Other: ${customReasonDetails.trim()}`
          : customReasonDetails.trim()
            ? `${selectedReason} - ${customReasonDetails.trim()}`
            : selectedReason;

      await authApi.deleteAccount(fullReason);
      setShowDeleteModal(false);
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_profile');
      queryClient.clear();
      notifyAuthChanged();
    } catch (err: any) {
      setIsDeleting(false);
      showAlert(
        isTagalog ? 'Hindi Nabura ang Account' : 'Deletion Failed',
        err?.message || t('delete_account_failed'),
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const status = await authApi.getDeleteAccountStatus();
      if (!status.can_delete) {
        // Tier 1: Blocked
        showAlert(
          isTagalog ? 'Hindi Maaaring Burahin' : 'Cannot Delete Account',
          status.reason
            ? sanitizeErrorMessage(status.reason)
            : t('delete_account_blocked_active_jobs'),
        );
        return;
      }

      setDeleteWarning(
        status.has_warning && status.warning ? sanitizeErrorMessage(status.warning) : null,
      );
      setSelectedReason(deleteReasons[0]);
      setCustomReasonDetails('');
      setShowDeleteModal(true);
    } catch (err: any) {
      showAlert(
        'Error',
        err?.message ||
          (isTagalog
            ? 'Hindi ma-check ang status ng account. Pakitingnan ang iyong koneksyon.'
            : 'Unable to check account status. Please check your connection.'),
      );
    }
  };

  const handleSwitchRole = () => {
    const isTargetWorker = userRole === 'employer';
    const title = isTargetWorker ? t('switch_to_worker') : t('switch_to_employer');
    const message = isTargetWorker
      ? `${t('switch_worker_desc')}\n\n${t('switch_worker_skills_note')}`
      : t('switch_employer_desc');

    showAlert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('continue'),
        onPress: async () => {
          try {
            await switchRole();
          } catch (e: any) {
            showAlert('Error', e?.message || t('failed_switch_roles'));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('settings')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="person-outline"
              title={t('edit_profile')}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="mail-outline"
              title={t('email_address')}
              subtitle={user?.email || 'N/A'}
              type="text"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="swap-horizontal-outline"
              title={userRole === 'worker' ? t('login_as_employer') : t('login_as_worker')}
              onPress={handleSwitchRole}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="language-outline"
              title={t('language')}
              subtitle={language === 'tl' ? 'Tagalog (Filipino)' : 'English'}
              onPress={() => {
                setPendingLanguage(language);
                setShowLanguageModal(true);
              }}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="notifications-outline"
              title={t('push_notifications')}
              type="toggle"
              value={notificationsEnabled}
              onToggle={setNotificationsEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="compass-outline"
              title={t('replay_tutorial')}
              subtitle={t('replay_tutorial_subtitle')}
              onPress={handleReplayTutorial}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="help-circle-outline"
              title={t('help_center')}
              onPress={() => setShowHelp(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubbles-outline"
              title={t('support_tickets')}
              onPress={() => navigation.navigate('SupportTickets' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text-outline"
              title={t('terms_of_service')}
              onPress={() => setShowTerms(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-closed-outline"
              title={t('privacy_policy')}
              onPress={() => setShowPrivacy(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow icon="log-out-outline" title={t('log_out')} onPress={handleLogout} />
            <View style={styles.divider} />
            <SettingRow
              icon="trash-outline"
              title={t('delete_account')}
              isDestructive={true}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        <Text style={styles.versionText}>SIKAP v1.0.0</Text>
      </ScrollView>

      {/* Help Center Modal */}
      <ContentModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        icon="help-circle-outline"
        iconColor={colors.primary}
        iconBg={colors.peach}
        title={t('help_center')}
        sections={isTagalog ? HELP_SECTIONS_TL : HELP_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Terms of Service Modal */}
      <ContentModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        icon="document-text-outline"
        iconColor="#6366F1"
        iconBg="#EEF2FF"
        title={t('terms_of_service')}
        sections={isTagalog ? TERMS_SECTIONS_TL : TERMS_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Privacy Policy Modal */}
      <ContentModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        icon="lock-closed-outline"
        iconColor={colors.mintDeep}
        iconBg={colors.mint}
        title={t('privacy_policy')}
        sections={isTagalog ? PRIVACY_SECTIONS_TL : PRIVACY_SECTIONS_EN}
        closeLabel={t('close')}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={cStyles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={[cStyles.sheet, { paddingBottom: bottomInset + 20 }]}>
            <View style={cStyles.handle} />
            <View style={cStyles.sheetHeader}>
              <View style={[cStyles.iconCircle, { backgroundColor: colors.peach }]}>
                <Ionicons name="language-outline" size={22} color={colors.primary} />
              </View>
              <Text style={cStyles.sheetTitle}>
                {pendingLanguage === 'tl' ? 'Pumili ng Wika' : 'Select Language'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={cStyles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.inkSoft} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 14, gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  pendingLanguage === 'en' && {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(232, 116, 74, 0.08)',
                  },
                  { paddingVertical: 14 },
                ]}
                onPress={() => setPendingLanguage('en')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pendingLanguage === 'en' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={pendingLanguage === 'en' ? colors.primary : colors.inkFaint}
                />
                <Text
                  style={[
                    styles.reasonOptionText,
                    pendingLanguage === 'en' && {
                      fontFamily: fonts.bodyBold,
                      color: colors.primary,
                    },
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  pendingLanguage === 'tl' && {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(232, 116, 74, 0.08)',
                  },
                  { paddingVertical: 14 },
                ]}
                onPress={() => setPendingLanguage('tl')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pendingLanguage === 'tl' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={pendingLanguage === 'tl' ? colors.primary : colors.inkFaint}
                />
                <Text
                  style={[
                    styles.reasonOptionText,
                    pendingLanguage === 'tl' && {
                      fontFamily: fonts.bodyBold,
                      color: colors.primary,
                    },
                  ]}
                >
                  Tagalog (Filipino)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLanguageModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  await setLanguage(pendingLanguage);
                  setShowLanguageModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {t('done') || (pendingLanguage === 'tl' ? 'Tapos na' : 'Done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Reason Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>{t('delete_account')}</Text>
                <Text style={styles.modalSubtitle}>
                  {isTagalog
                    ? 'Sabihin sa amin kung bakit mo gustong burahin ang iyong account'
                    : 'Please tell us why you are leaving'}
                </Text>
              </View>
            </View>

            {deleteWarning && (
              <View style={styles.warningBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#B45309"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.warningBoxText}>{deleteWarning}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 220, marginVertical: 12 }}>
              <Text style={styles.inputLabel}>
                {isTagalog ? 'Pumili ng dahilan:' : 'Select a reason:'}
              </Text>
              {deleteReasons.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.error : colors.inkLight}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        isSelected && { fontFamily: fonts.bodyBold, color: colors.ink },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>
                {isTagalog ? 'Karagdagang komento (opsyonal):' : 'Additional feedback (optional):'}
              </Text>
              <TextInput
                style={styles.customReasonInput}
                placeholder={
                  isTagalog
                    ? 'Tulungan kaming mapaganda pa ang SIKAP...'
                    : 'Help us improve SIKAP...'
                }
                placeholderTextColor={colors.inkLight}
                value={customReasonDetails}
                onChangeText={setCustomReasonDetails}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>
                  {isTagalog ? 'Panatilihin ang Account' : 'Keep Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={executeAccountDeletion}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>{t('delete_account')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.paperBright,
  },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginLeft: 50 },
  versionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkLight,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    ...shadows.color,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  warningBoxText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paper,
    marginBottom: 6,
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  reasonOptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    flex: 1,
  },
  customReasonInput: {
    backgroundColor: colors.paper,
    borderColor: colors.inkFaint,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    minHeight: 64,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#fff',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#fff',
  },
});

export default SettingsScreen;
