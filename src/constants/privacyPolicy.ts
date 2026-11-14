export type ContentSection = { heading?: string; body: string };

export const PRIVACY_SECTIONS_EN: ContentSection[] = [
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

export const PRIVACY_SECTIONS_TL: ContentSection[] = [
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
