import { TranslationKey } from './en';

export const tl: Record<TranslationKey, string> = {
  // 1-13: Settings & Sections
  settings: 'Mga Setting',
  account: 'Account',
  preferences: 'Mga Preference',
  language: 'Wika',
  language_current: 'Tagalog (Filipino)',
  push_notifications: 'Mga Push Notification',
  location_services: 'Mga Serbisyo sa Lokasyon',
  support: 'Tulong',
  help_center: 'Help Center',
  support_tickets: 'Mga Request sa Support',
  terms_of_service: 'Mga Tuntunin sa Paggamit',
  privacy_policy: 'Patakaran sa Privacy',
  log_out: 'Mag-log out',
  delete_account: 'Burahin ang Account',

  // 14-25: Account Actions & Info
  confirm_logout_msg: 'Sigurado ka bang gusto mong mag-log out?',
  edit_profile: 'I-edit ang Profile',
  full_name: 'Buong Pangalan',
  email_address: 'Email Address',
  phone_number: 'Numero ng Telepono',
  date_of_birth: 'Petsa ng Kapanganakan',
  municipality: 'Bayan',
  barangay: 'Barangay',
  login_as_employer: 'Gamitin ang Employer Account',
  login_as_worker: 'Gamitin ang Worker Account',
  switch_to_worker: 'Lumipat sa Worker Mode',
  switch_to_employer: 'Lumipat sa Employer Mode',

  // 26-39: Role Switch & Account Deletion Details
  switch_worker_desc:
    'Lilipat ka sa Worker Mode. Dito, puwede kang maghanap ng mga trabaho sa inyong lugar, mag-apply, at mag-save ng mga trabahong interesado ka.',
  switch_worker_skills_note:
    'Kung wala pang nakalagay na kasanayan sa iyong profile, tutulungan ka munang idagdag ang mga ito.',
  switch_employer_desc:
    'Lilipat ka sa Employer Mode. Dito, puwede kang mag-post ng trabaho, tumingin ng mga aplikante, at kumuha ng mga manggagawa.',
  failed_switch_roles: 'Hindi napalitan ang account mode mo. Pakisubukan ulit.',
  delete_account_warning:
    'Permanenteng mabubura ang iyong profile, kasaysayan ng trabaho, at iba pang datos ng account. Hindi na ito maibabalik kapag natuloy.',
  delete_account_blocked_active_jobs:
    'May mga trabaho ka pang ginagawa o aplikasyon na hindi pa tapos. Tapusin o kanselahin muna ang mga ito bago burahin ang account mo.',
  delete_account_warning_rating_window:
    'May natapos ka nang trabaho na maaari pang bigyan ng rating o review. Kapag binura mo ang account mo, hindi ka na makakapagbigay o makakatanggap ng review para sa mga trabahong iyon.',
  delete_reason_prompt: 'Pumili ng dahilan kung bakit mo gustong burahin ang account mo:',
  reason_found_job: 'Nakahanap na ako ng trabaho sa iba',
  reason_too_many_notifications: 'Sobrang daming notification',
  reason_not_using: 'Hindi ko na ginagamit ang app na ito',
  reason_privacy_concerns: 'May alalahanin ako tungkol sa privacy o seguridad',
  reason_other: 'Iba pang dahilan (pakitukoy)',
  delete_account_failed: 'Hindi nabura ang account mo. Pakisubukan ulit mamaya.',

  // 40-50: Main Navigation & Tabs
  find_jobs: 'Maghanap ng Trabaho',
  my_applications: 'Mga Aplikasyon Ko',
  my_jobs: 'Mga Trabaho Ko',
  post_a_job: 'Mag-post ng Trabaho',
  messages: 'Mga Mensahe',
  profile: 'Profile',
  notifications: 'Mga Notification',
  search_jobs_placeholder: 'Maghanap ng trabaho, kasanayan, o barangay...',
  all: 'Lahat',
  urgent: 'Agarang Kailangan',
  filter: 'Filter',

  // 51-71: Job Feed & Details
  no_jobs_found: 'Walang trabahong tumutugma sa hinahanap mo. Subukang baguhin ang mga filter.',
  compensation: 'Bayad',
  per_day: 'kada araw',
  per_hour: 'kada oras',
  fixed_per_project: 'takdang bayad / kada proyekto',
  slots_available: 'Bukas Pang Puwesto',
  filled_slots: 'Napunan nang Puwesto',
  location: 'Lokasyon',
  posted_by: 'Nag-post',
  date_posted: 'Petsa ng Pag-post',
  job_description: 'Paglalarawan ng Trabaho',
  requirements: 'Mga Kailangan',
  apply_now: 'Mag-apply',
  save_job: 'I-save ang Trabaho',
  saved_jobs: 'Mga Na-save na Trabaho',
  job_saved_bookmark: 'Na-save na ang trabahong ito.',
  job_removed_bookmark: 'Inalis na ang trabaho sa mga na-save mo.',
  already_applied: 'Nakapag-apply Ka Na',
  closed: 'Sarado na',
  in_progress: 'Kasalukuyang Ginagawa',
  job_already_filled:
    'May nakuha na para sa trabahong ito o hindi na ito tumatanggap ng mga aplikasyon.',

  // 72-90: Application Lifecycle
  submit_application: 'Isumite ang Aplikasyon',
  confirm_apply_prompt: 'Sigurado ka bang gusto mong mag-apply sa trabahong ito?',
  cover_note: 'Mensahe para sa Employer',
  why_fit_question: 'Bakit sa tingin mo ay bagay sa iyo ang trabahong ito?',
  cover_note_desc: 'Sabihin sa employer kung bakit ikaw ang angkop na tao para sa trabahong ito.',
  application_submitted_success:
    'Naipasa na ang aplikasyon mo! Titingnan ng employer ang iyong profile.',
  already_applied_notice:
    'Nakapag-apply ka na sa trabahong ito. Tingnan ang status nito sa Mga Aplikasyon Ko.',
  application_status: 'Status ng Aplikasyon',
  status_under_review: 'Sinusuri pa',
  status_shortlisted: 'Napili para sa susunod na hakbang',
  status_job_offer_received: 'May Natanggap na Alok sa Trabaho',
  status_hired: 'Natanggap sa Trabaho',
  status_completed: 'Tapos na',
  status_declined: 'Hindi Tinanggap',
  status_withdrawn: 'Binawi',
  confirm_withdraw_prompt:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  withdraw_application: 'Bawiin ang Aplikasyon',
  accept_offer: 'Tanggapin ang Alok',
  decline_offer: 'Tanggihan ang Alok',

  // 91-102: Shortlisting & Completion
  shortlisted_chat_notice:
    'Napili ng employer ang aplikasyon mo para sa susunod na hakbang. Maaari na kayong mag-usap sa chat.',
  offer_sent_notice:
    'Nagpadala ang employer ng opisyal na alok sa trabaho. Tingnan sa ibaba ang detalye ng bayad.',
  accept_terms_prompt: 'Tinatanggap mo ba ang alok na trabaho at ang mga kundisyong nakasaad dito?',
  congratulations_hired:
    'Congratulations! Tinanggap mo ang alok, kaya opisyal ka nang tanggap sa trabaho.',
  declined_offer_notice: 'Tinanggihan mo ang alok sa trabaho. Aabisuhan ang employer.',
  confirm_hire: 'Kumpirmahin ang Pagkuha sa Trabaho',
  confirm_hire_desc:
    'Kumpirmahin na kukunin mo na ang manggagawang ito. Siguraduhing nagkasundo kayo sa bayad.',
  cancel_hire: 'Kanselahin ang Pagkuha',
  confirm_cancel_hire_prompt:
    'Sigurado ka bang gusto mong kanselahin ang kasunduan sa pagkuha sa trabaho?',
  mark_as_completed: 'Markahang Tapos na',
  mark_completed_desc:
    'Markahang tapos na ang trabaho kapag natapos na ang lahat ng gawain at naibigay na ang bayad.',
  job_marked_completed_notice:
    'Namarkahan nang tapos ang trabaho. Mag-iwan ng rating at review para sa nakausap mong employer o manggagawa.',

  // 103-120: Profile & Verification Elements
  my_profile: 'Profile Ko',
  verified_member: 'Beripikadong Miyembro',
  verification_pending: 'Naghihintay ng Beripikasyon',
  unverified: 'Hindi Pa Beripikado',
  reputation_score: 'Rating ng Reputasyon',
  completed_jobs: 'Mga Natapos na Trabaho',
  reviews_ratings: 'Mga Review at Rating',
  member_since: 'Miyembro Mula Noong',
  skills: 'Mga Kasanayan',
  add_skills: 'Magdagdag ng mga Kasanayan',
  select_your_skills: 'Piliin ang mga kaya mong gawin',
  work_experience: 'Karanasan sa Trabaho',
  add_experience: 'Magdagdag ng Karanasan sa Trabaho',
  character_references: 'Mga Taong Maaaring Magbigay ng Rekomendasyon',
  add_reference: 'Magdagdag ng Reference',
  emergency_contact: 'Taong Tatawagan Kapag May Emergency',
  emergency_contact_name: 'Pangalan ng Taong Tatawagan',
  emergency_contact_phone: 'Numero ng Taong Tatawagan',

  // 121-130: Government ID & Verification Steps
  upload_gov_id: 'Mag-upload ng Government ID',
  upload_id_instructions:
    'Mag-upload ng malinaw na larawan ng valid mong government ID. Siguraduhing hindi putol ang anumang bahagi nito.',
  id_readability_warning:
    'Tiyaking malinaw na nababasa ang buong pangalan, larawan, petsa ng kapanganakan, at ID number mo.',
  front_of_id: 'Harap ng ID',
  back_of_id: 'Likod ng ID',
  take_selfie_id: 'Mag-selfie Habang Hawak ang ID',
  selfie_instructions: 'Kumuha ng malinaw na selfie habang hawak ang ID sa tabi ng mukha mo.',
  id_submitted_notice: 'Naipasa na ang government ID at selfie mo para masuri ng admin.',
  awaiting_approval_notice:
    'Naghihintay pa ng pag-apruba ng admin ang account mo. Makakatanggap ka ng notification kapag beripikado na ito.',
  id_rejected_notice:
    'Hindi tinanggap ang nauna mong ipinasa na ID. Basahin ang dahilan sa ibaba at magpasa ng mas malinaw na mga larawan.',

  // 131-143: Messaging & Direct Contact
  conversation: 'Usapan',
  type_message_placeholder: 'Mag-type ng mensahe...',
  typing: 'nagta-type...',
  online: 'Online',
  offline: 'Offline',
  phone_protected_notice:
    'Nakatago at protektado ang mga numero ng telepono at iba pang personal na detalye hanggang makumpirma ang pagkuha sa trabaho.',
  safety_warning_money:
    'Para sa kaligtasan mo, huwag ibahagi ang detalye ng bank account o password mo, at huwag magpadala ng pera kung walang kumpirmadong kasunduan.',
  matched_conversation_started:
    'Nagsimula na ang inyong pag-uusap matapos kayong maitugma. Maaari na ninyong pag-usapan ang mga gawain at kailangan sa trabaho.',
  contact_unlocked:
    "Makikita na ninyo ang contact details ng isa't isa. Maaari na kayong direktang magtawagan.",
  call_worker: 'Tawagan ang Manggagawa',
  call_employer: 'Tawagan ang Employer',
  send_formal_offer: 'Magpadala ng Opisyal na Alok sa Trabaho',
  no_messages_yet: 'Wala pang mensahe. Mag-hi para simulan ang usapan!',

  // 144-156: Reviews & Ratings
  leave_a_review: 'Mag-iwan ng Review',
  overall_rating: 'Pangkalahatang Rating',
  punctuality_reliability: 'Pagiging Nasa Oras at Maaasahan',
  quality_of_work: 'Kalidad ng Trabaho',
  communication: 'Pakikipag-usap',
  rate_overall_experience: 'Kumusta ang kabuuang karanasan mo sa pakikipagtrabaho sa user na ito?',
  rate_punctuality_prompt:
    'I-rate kung gaano siya kadalas dumating sa oras at kung gaano siya maaasahan sa trabaho.',
  rate_quality_prompt: 'I-rate ang kalidad ng ginawa niyang trabaho.',
  rate_communication_prompt: 'I-rate kung gaano siya kahusay at kagalang makipag-usap.',
  share_experience_placeholder: 'Ibahagi ang naging karanasan ninyo sa pagtatrabaho...',
  write_review_guide:
    'Sumulat ng review tungkol sa naging karanasan mo. Makakatulong ito sa ibang gumagamit ng SIKAP sa Sorsogon.',
  submit_review: 'Isumite ang Review',
  review_submitted_thanks:
    'Salamat! Naipasa na ang review mo at naidagdag ito sa rating ng reputasyon ng user.',

  // 157-161: Reports & Safety
  report_user: 'I-report ang User',
  report_job_post: 'I-report ang Job Post',
  reason_for_report: 'Dahilan ng Pag-report',
  report_describe_placeholder: 'Ipaliwanag kung bakit mo inire-report ang user o job post na ito.',
  report_investigate_notice:
    'Susuriin ng aming team ang report na ito. Salamat sa pagtulong na mapanatiling ligtas ang SIKAP.',

  // 162-180: Common Actions, Errors & Prompts
  save: 'I-save',
  cancel: 'Kanselahin',
  decline: 'Tanggihan',
  confirm: 'Kumpirmahin',
  back: 'Bumalik',
  next: 'Susunod',
  submit: 'Isumite',
  close: 'Isara',
  delete: 'Burahin',
  edit: 'I-edit',
  continue: 'Magpatuloy',
  loading: 'Naglo-load...',
  something_went_wrong: 'May nangyaring problema. Pakisubukan ulit.',
  no_internet: 'Walang koneksyon sa internet. Tingnan kung naka-on ang Wi-Fi o mobile data mo.',
  session_expired: 'Nag-expire na ang session mo. Mag-log in ulit para magpatuloy.',
  server_connection_error:
    'Hindi makakonekta sa server ng SIKAP. Pakisubukan ulit pagkalipas ng ilang sandali.',
  fill_required_fields: 'Punan muna ang lahat ng kailangang field bago magpatuloy.',
  password_min_length: 'Dapat ay may walong character o higit pa ang password.',
  passwords_dont_match: 'Hindi magkapareho ang mga password. Ilagay ulit ang password mo.',
  otp_sent_email: 'Nagpadala kami ng 6-digit na verification code sa email mo.',

  // Aliases & UI Helpers
  review_offer: 'Tingnan ang Alok',
  rate_review_partner: 'Mag-iwan ng Review',
  status_job_offer: 'May Natanggap na Alok sa Trabaho',
  job_offer_received: 'May Natanggap na Alok sa Trabaho',
  block_user: 'I-block ang User',
  unblock_user: 'I-unblock ang User',
  no_conversations_yet: 'Wala pang usapan',
  no_messages_here:
    'Kapag nag-apply ka o nagkaroon ng tugma sa trabaho, lalabas dito ang mga pag-uusap ninyo.',
  withdraw_confirm:
    'Sigurado ka bang gusto mong bawiin ang aplikasyon mo? Hindi mo na ito maibabalik kapag itinuloy mo.',
  job_closed_notice:
    'May nakuha na para sa trabahong ito o hindi na ito tumatanggap ng mga aplikasyon.',
  tell_employer_why_fit:
    'Sabihin sa employer kung bakit ikaw ang angkop na tao para sa trabahong ito.',
  employer_sent_offer_notice:
    'Nagpadala ang employer ng opisyal na alok sa trabaho. Tingnan sa ibaba ang detalye ng bayad.',

  // Group 1: Worker Previewing Employer Profile
  employer_profile: 'Profile ng Nag-aalok ng Trabaho',
  about_the_employer: 'Tungkol sa Nag-aalok ng Trabaho',
  tap_view_employer_profile: 'I-tap para makita ang profile at mga dokumento ng employer →',
  verified_employer: 'Beripikadong Employer',
  unverified_employer: 'Hindi Pa Beripikadong Employer',
  employer_reputation: 'Reputasyon ng Employer',
  overall_employer_rating: 'Kabuuang Rating ng Employer',
  no_ratings_yet: 'Wala pang rating (0 review)',
  verification_and_documents: 'Beripikasyon at mga Dokumento',
  business_doc_verified: 'Beripikado ang Dokumento ng Negosyo',
  documents_under_review: 'Sinusuri pa ang mga Dokumento',
  business_doc_not_verified: 'Hindi Beripikado ang Dokumento ng Negosyo',
  employer_doc_verified_desc:
    'Nakumpleto na ng employer na ito ang beripikasyon ng mga dokumento ng negosyo sa SIKAP.',
  employer_doc_under_review_desc:
    'Naipasa na ang mga dokumento ng negosyo at kasalukuyang sinusuri ng mga admin ng SIKAP.',
  employer_doc_not_verified_desc:
    'Hindi pa nakukumpleto ng employer na ito ang beripikasyon ng mga dokumento ng negosyo sa SIKAP.',
  attached_business_docs: 'Mga Kalakip na Dokumento ng Negosyo:',
  pdf_view: 'PDF',
  reviews_feedback: 'Mga Review at Komento',
  loading_reviews: 'Kinukuha ang mga review...',
  no_reviews_yet: 'Wala pang review',
  no_reviews_employer_desc:
    'Lalabas dito ang mga review ng mga manggagawang nakatapos na ng trabaho para kay {employerName} kapag naisumite na ang mga ito.',
  verified_worker: 'Beripikadong Manggagawa',
  completed_job: 'Natapos na Trabaho',

  // Group 2: Reporting Module & Sheets
  submit_a_report: 'Magsumite ng Ulat',
  whats_the_issue: 'Ano ang problema?',
  report_anonymous_notice:
    'Hindi makikita kung sino ang nag-report. Sinusuri namin ang lahat ng ulat para mapanatiling ligtas ang komunidad.',
  reason_inappropriate_behavior: 'Hindi Angkop na Pag-uugali',
  reason_scam_fraud: 'Panloloko o Pekeng Trabaho',
  reason_fake_scam_job: 'Panloloko o Pekeng Trabaho',
  reason_harassment: 'Pangha-harass',
  reason_spam: 'Spam',
  reason_inappropriate_content: 'Hindi Angkop na Nilalaman',
  reason_other_report: 'Iba pa',
  provide_more_details: 'Magbigay pa ng detalye',
  describe_what_happened: 'Ikuwento kung ano ang nangyari...',
  describe_why_reporting_job: 'Sabihin kung bakit mo inire-report ang trabahong ito...',
  attach_evidence: 'Maglakip ng Ebidensya',
  screenshots_help_review:
    'Makakatulong ang mga screenshot para mas mabilis naming masuri at maaksyunan ang report.',
  add_photo: 'Magdagdag ng Larawan',
  submit_report: 'Isumite ang Report',
  upload_limit_screenshots: 'Maaari kang mag-upload ng hanggang 5 screenshot sa bawat report.',
  photo_library_permission_required:
    'Payagan ang app na i-access ang mga larawan sa iyong phone para makapagdagdag ka ng mga screenshot.',
  please_select_report_reason: 'Pumili muna ng dahilan ng pag-report.',
  report_submitted_title: 'Naipasa na ang Report',
  report_submitted_desc:
    'Salamat sa pagtulong na mapanatiling ligtas ang ating komunidad. Susuriin namin ang iyong report sa lalong madaling panahon.',
  already_reported_item:
    'Nakapag-report ka na tungkol dito. Kasalukuyan na itong sinusuri ng aming team.',

  // Group 3: Jobs, Details, Applications
  duration: 'Tagal ng Trabaho',
  flexible: 'Maaaring Pag-usapan',
  tools_required: 'Mga Kagamitang Kailangan',
  attachments_media: 'Mga Kalakip at Media',
  play_video: 'I-play ang Video',
  all_filled: 'Wala nang Bakante',
  slots_left: 'bakante pa',
  needs_action: 'Kailangan ng Aksyon',
  active_hired: 'Kasalukuyang Trabaho',
  in_review: 'Sinusuri',
  history: 'Kasaysayan',
  all_caught_up: 'Wala ka nang kailangang asikasuhin!',
  no_pending_offers_reviews:
    'Wala kang nakabinbing alok sa trabaho o review na kailangan mong sagutin.',
  no_active_jobs_title: 'Wala ka pang kasalukuyang trabaho',
  no_active_jobs_desc:
    'Kapag kinumpirma ng employer na ikaw ang kukunin, lalabas dito ang trabaho mo.',
  no_applications_under_review_title: 'Wala kang application na sinusuri',
  no_applications_under_review_desc:
    'Wala kang application na kasalukuyang sinusuri. Maghanap ng trabaho at mag-apply.',
  no_applications_yet_title: 'Wala ka pang ina-applyang trabaho',
  no_applications_yet_desc: 'Tingnan ang mga trabahong available at mag-apply sa ilang tap lang.',
  browse_available_jobs: 'Tingnan ang mga Trabaho',
  jobs_nearby: 'trabahong malapit sa iyo.',
  location_anywhere: 'Kahit Saan',
  location_same_barangay: 'Sa Parehong Barangay',
  location_same_municipality: 'Sa Parehong Munisipyo',
  reset_filters: 'I-reset ang mga Filter',
  your_own_job_posting: 'Ikaw ang nag-post ng trabahong ito.',
  cannot_apply_own_job: 'Hindi ka puwedeng mag-apply sa trabahong ikaw mismo ang nag-post.',
  already_applied_job: 'Nag-apply ka na sa trabahong ito.',
  click_to_manage_app: 'I-tap dito para pamahalaan ang application mo →',

  // Group 4: Need Help & Support / Support Tickets
  need_help_or_support: 'Kailangan mo ba ng Tulong?',
  help_and_support: 'Tulong at Suporta',
  my_tickets: 'Mga Request Ko',
  new_ticket: 'Bagong Request',
  ticket_number: 'Request #{id}',
  status_in_review: 'Sinusuri',
  status_resolved: 'Nalutas',
  status_open: 'Bukas',
  sikap_admin_team: 'Admin Team ng SIKAP',
  response_available: 'May Sagot na',
  in_review_by_admin: 'Sinusuri ito ng admin ng SIKAP. Dito lalabas ang sagot.',
  tap_to_expand: 'I-tap para makita ang buong detalye',
  tap_to_collapse: 'I-tap para itago ang detalye',
  no_support_tickets_yet: 'Wala Ka Pang Support Request',
  support_tickets_empty_desc:
    'May tanong ka ba tungkol sa job post, beripikasyon, o account mo? Magpadala ng support request at sasagot ang admin team dito mismo sa app.',
  submit_support_ticket: 'Magpadala ng Support Request',
  support_in_app_notice:
    'Dito mismo sa SIKAP inaasikaso ang mga support request. Makikita ang sagot ng admin sa tab na “Mga Request Ko.”',
  subject: 'Paksa',
  subject_placeholder: 'Hal. Tanong tungkol sa status ng trabaho, pag-upload ng ID, o account',
  issue_description: 'Paglalarawan ng Problema',
  issue_description_placeholder:
    'Ilarawan nang mas detalyado kung ano ang kailangan mo ng tulong...',
  submit_ticket_btn: 'Ipadala ang Request',
  ticket_submitted_title: 'Naipadala na ang Request',
  ticket_submitted_desc:
    'Natanggap na namin ang iyong support request. Susuriin ito ng admin team at sasagot dito mismo sa app.',
  contact_support_title: 'Tulong at Suporta',
  contact_support_desc:
    'May problema ka ba? Magpadala ng mensahe at susuriin ng admin support team ang request mo dito mismo sa app.',

  // Group 5: Messages & Chat Features
  search_messages_placeholder: 'Maghanap gamit ang pangalan o trabaho...',
  concluded: 'Tapos na',
  no_conversations_matching: 'Walang usapang tumutugma sa “{searchQuery}”',
  action_required: 'Kailangan ng Aksyon',
  deleted_account_notice:
    'Nabura na ang account ng taong ito. Makikita mo pa rin ang mga dati ninyong mensahe.',
  chat_locked_concluded: 'Naka-lock ang chat nang matapos ang trabaho.',
  reopen_pending_employer:
    'Naghihintay ng pag-apruba ng employer ang request na buksan muli ang chat.',
  request_to_reopen: 'Humiling na Buksan Muli',
  unlock_chat: 'Buksan ang Chat',
  user_blocked_by_me: 'Naka-block ang user na ito sa iyo.',
  cannot_message_user: 'Hindi mo maaaring padalhan ng mensahe ang user na ito.',
  employer_will_send_first_msg:
    'Ang employer ang unang magpapadala ng mensahe o alok sa trabaho para masimulan ang usapan.',
  messaging_disabled_deleted_account:
    'Hindi na puwedeng magpadala ng mensahe dahil wala na ang account na ito.',
  slots_full_messaging_disabled:
    'Wala nang bakante para sa trabahong ito, kaya hindi na puwedeng magpadala ng mensahe tungkol dito.',
  slots_full_no_negotiation:
    'Wala nang bakante, kaya hindi na puwedeng makipag-usap para sa ibang kasunduan.',
  chat_is_open_notice:
    'Bukas ang chat · Maaari ninyong pag-usapan ng employer ang mga detalye ng trabaho.',
  send_message_before_hire_notice:
    'Magpadala muna ng mensahe sa manggagawa bago magpasya kung kukunin siya.',
  hire_decision: 'Desisyon sa Pagkuha',
  hire_decision_prompt:
    'Gusto mo bang kunin ang aplikanteng ito o tanggihan ang kanyang application?',
  hire_worker: 'Kunin ang Manggagawa',
  decline_applicant: 'Tanggihan ang Application',
  set_final_price_confirm_hire: 'Itakda ang Napagkasunduang Bayad at Kumpirmahin ang Pagkuha',
  set_final_agreed_price: 'Itakda ang Napagkasunduang Bayad',
  enter_agreed_price_placeholder: 'Ilagay ang napagkasunduang bayad (₱)',
  shortlisted_application: 'Napiling Application',
  stage_2: 'Yugto 2',
  next_steps: 'Mga Susunod na Hakbang',
  hire_offer_sent: 'Naipadala na ang Alok sa Trabaho',
  waiting_worker_response:
    'Hinihintay ang sagot ni {workerName} kung tatanggapin o tatanggihan niya ang alok.',
  job_offer_declined: 'Tinanggihan ang Alok sa Trabaho',
  job_offer_accepted: 'Tinanggap ang Alok sa Trabaho',
  position_filled: 'May Napili Nang Manggagawa',
  hiring_cancelled: 'Kinansela ang Pagkuha',
  cancel_hire_before_accept:
    'Maaari mong kanselahin ang pagkuha bago tanggapin ng manggagawa ang alok.',
  employer_contact: 'Contact ng Employer',
  worker_contact: 'Contact ng Manggagawa',
  job_marked_complete: 'Minarkahang Tapos na ang Trabaho',
  work_completed_verified: 'Natapos na at nakumpirma ang pagkakagawa ng trabaho.',
  rate_employer: 'I-rate ang Employer',
  rate_worker: 'I-rate ang Manggagawa',
  mark_complete_subtitle: 'I-tap kapag ganap nang tapos ang trabaho.',
  quick_replies: 'Mabilisang Sagot',
  qr_worker_available_label: 'Available bukas',
  qr_worker_available_text: 'Available ako bukas.',
  qr_worker_location_label: 'Eksaktong lugar?',
  qr_worker_location_text: 'Ano ang eksaktong address o malapit na palatandaan ng lugar?',
  qr_worker_tools_label: 'May sariling gamit 🔨',
  qr_worker_tools_text: 'May sarili akong mga kagamitan para sa trabaho.',
  qr_worker_call_label: 'Puwede tumawag?',
  qr_worker_call_text: 'Puwede ba kitang tawagan para mapag-usapan ang mga detalye?',
  qr_worker_agreed_label: 'Sang-ayon! 👍',
  qr_worker_agreed_text: 'Sumasang-ayon ako sa napag-usapang bayad at iskedyul. Salamat!',
  qr_employer_start_label: 'Kailan makakapagsimula?',
  qr_employer_start_text: 'Kailan ka pinakamaagang makakapagsimula?',
  qr_employer_nearby_label: 'Malapit ka lang ba?',
  qr_employer_nearby_text: 'Malapit ka lang ba o nasa katabing barangay?',
  qr_employer_tools_label: 'May kagamitan ka ba?',
  qr_employer_tools_text: 'May sarili ka bang mga kagamitan para sa trabahong ito?',
  qr_employer_offer_label: 'Tingnan ang alok',
  qr_employer_offer_text: 'Pakitingnan ang opisyal na alok sa trabaho sa card sa itaas.',
  qr_employer_thanks_label: 'Salamat!',
  qr_employer_thanks_text: 'Salamat sa mabilis mong pagsagot!',
};
