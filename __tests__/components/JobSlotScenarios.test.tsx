import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobCard } from '../../src/components/jobs/JobCard';
import ActionCard from '../../src/components/chat/ActionCard';
import { getApplicationStageInfo } from '../../src/components/applications/ApplicationCard';
import { JobPost, Message } from '../../src/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    setQueriesData: jest.fn(),
    cancelQueries: jest.fn(),
  }),
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('../../src/contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: jest.fn(),
  }),
}));

jest.mock('../../src/api/client', () => ({
  apiClient: jest.fn(),
}));

const mockMutateReact = jest.fn();
jest.mock('../../src/hooks/useReactToJob', () => ({
  useReactToJob: () => ({
    mutate: mockMutateReact,
    isPending: false,
  }),
}));

const createBaseJob = (overrides: Partial<JobPost> = {}): JobPost =>
  ({
    id: 1,
    reference_number: 'JOB-2026-0001',
    title: 'Masonry & Wall Plastering',
    description: 'Need experienced masons for perimeter wall plastering.',
    category: 'Construction',
    categories: ['Construction'],
    municipality: 'Sorsogon City',
    barangay: 'Bibincahan',
    compensation: 650,
    rate_unit: 'per_day',
    slots: 2,
    filled_slots: 0,
    remaining_slots: 2,
    accepted_count: 0,
    status: 'open',
    is_urgent: false,
    is_applied: false,
    is_withdrawn: false,
    created_at: new Date().toISOString(),
    employer: {
      id: 10,
      name: 'Engr. Roberto Santos',
      verification_badge: true,
    } as any,
    ...overrides,
  }) as unknown as JobPost;

describe('Multi-Slot Job & Hiring Scenarios Test Suite (Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 2-SLOT REFERENCE EXAMPLE & SECTION A / E: Slot Display on JobCard
  // =========================================================================
  describe('Reference Example & Slot Counts (A1, E1, E2, E3, E7)', () => {
    it('A1: renders 1-slot, 2-slot, and 3+ slot open jobs with accurate initial slot labels', async () => {
      const oneSlot = await render(
        <JobCard
          job={createBaseJob({ slots: 1, remaining_slots: 1, filled_slots: 0 })}
          onPress={jest.fn()}
        />,
      );
      expect(oneSlot.getByText('1 slot')).toBeTruthy();

      const twoSlots = await render(
        <JobCard
          job={createBaseJob({ slots: 2, remaining_slots: 2, filled_slots: 0 })}
          onPress={jest.fn()}
        />,
      );
      expect(twoSlots.getByText('2 slots')).toBeTruthy();

      const fourSlots = await render(
        <JobCard
          job={createBaseJob({ slots: 4, remaining_slots: 4, filled_slots: 0 })}
          onPress={jest.fn()}
        />,
      );
      expect(fourSlots.getByText('4 slots')).toBeTruthy();
    });

    it('Reference Table & E1: 2-slot job with 1 slot occupied/reserved shows "1 left" and remains open', async () => {
      const { getByText, queryByText } = await render(
        <JobCard
          job={createBaseJob({
            slots: 2,
            filled_slots: 1,
            remaining_slots: 1,
            status: 'open',
          })}
          onPress={jest.fn()}
        />,
      );

      expect(getByText(/1\s+left/i)).toBeTruthy();
      expect(queryByText('CLOSED')).toBeNull();
    });

    it('Reference Table & E2/E3: 2-slot job with all slots reserved or accepted shows CLOSED badge and "All filled (2/2)"', async () => {
      const { getByText } = await render(
        <JobCard
          job={createBaseJob({
            slots: 2,
            filled_slots: 2,
            remaining_slots: 0,
            status: 'closed_in_progress',
          })}
          onPress={jest.fn()}
        />,
      );

      expect(getByText('CLOSED')).toBeTruthy();
      expect(getByText('All filled (2/2)')).toBeTruthy();
    });

    it('E5/E6: when a declined/cancelled offer reopens a 2-slot job back to 1/2 filled, CLOSED badge disappears', async () => {
      const { getByText, queryByText, rerender } = await render(
        <JobCard
          job={createBaseJob({
            slots: 2,
            filled_slots: 2,
            remaining_slots: 0,
            status: 'closed_in_progress',
          })}
          onPress={jest.fn()}
        />,
      );

      expect(getByText('All filled (2/2)')).toBeTruthy();

      // Worker B declines offer -> job reopens with 1 filled, 1 remaining
      await rerender(
        <JobCard
          job={createBaseJob({
            slots: 2,
            filled_slots: 1,
            remaining_slots: 1,
            status: 'open',
          })}
          onPress={jest.fn()}
        />,
      );

      expect(queryByText('All filled (2/2)')).toBeNull();
      expect(queryByText('CLOSED')).toBeNull();
      expect(getByText(/1\s+left/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // SECTION B: Workers Discovering, Saving, Applying, Withdrawing (B1, B5, B6)
  // =========================================================================
  describe('Worker Discovery & Application Badges (B1, B5, B6)', () => {
    it('B1: saving a job triggers onSave without altering slot availability', async () => {
      const onSaveMock = jest.fn();
      const { getByLabelText, getByText } = await render(
        <JobCard
          job={createBaseJob({ slots: 2, filled_slots: 0, remaining_slots: 2 })}
          onPress={jest.fn()}
          onSave={onSaveMock}
          isSaved={false}
        />,
      );

      await fireEvent.press(getByLabelText('Save job'));
      expect(onSaveMock).toHaveBeenCalledTimes(1);
      expect(getByText('2 slots')).toBeTruthy();
    });

    it('B5: worker who already applied sees APPLIED badge', async () => {
      const { getByText, queryByText } = await render(
        <JobCard
          job={createBaseJob({
            slots: 2,
            filled_slots: 2,
            remaining_slots: 0,
            status: 'closed_in_progress',
            is_applied: true,
            is_withdrawn: false,
          })}
          onPress={jest.fn()}
        />,
      );

      expect(getByText('APPLIED')).toBeTruthy();
      // An applied worker sees APPLIED rather than the generic CLOSED badge
      expect(queryByText('CLOSED')).toBeNull();
    });

    it('B6: worker who withdrew sees WITHDRAWN badge', async () => {
      const { getByText } = await render(
        <JobCard
          job={createBaseJob({
            is_applied: false,
            is_withdrawn: true,
          })}
          onPress={jest.fn()}
        />,
      );

      expect(getByText('WITHDRAWN')).toBeTruthy();
    });
  });

  // =========================================================================
  // SECTION C, D, E: Offers, Separate Prices, Slot Locks, Reserved Worker (C6, D1-D9, E2-E5)
  // =========================================================================
  describe('ActionCard Offers, Multi-Worker Prices & Slot Locking (C6, D1-D9, E2-E5)', () => {
    const baseJobRequestMsg: Message = {
      id: 201,
      conversation_id: 11,
      sender_id: null,
      message_type: 'action_card',
      card_type: 'job_request',
      card_data: {
        application_id: 50,
        job_title: 'Masonry & Wall Plastering',
        employer_name: 'Engr. Roberto Santos',
        worker_name: 'Candidate C',
      },
      card_resolved: false,
      created_at: '2026-10-01T00:00:00.000Z',
    };

    it('E2/E3: shortlisted Candidate C sees slot-locked banner when all slots are reserved/filled (isSlotLocked=true)', async () => {
      const { getByText, queryByText } = await render(
        <ActionCard
          message={baseJobRequestMsg}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={11}
          conversationStatus="open"
          applicationStatus="pending_negotiation"
          hasRealMessageFromEmployer={true}
          isSlotLocked={true}
          onActionComplete={jest.fn()}
        />,
      );

      expect(getByText('Slots are full. No other negotiation can take place.')).toBeTruthy();
      expect(queryByText('Hire Decision')).toBeNull();
      expect(queryByText('Confirm Hire')).toBeNull();
    });

    it('D6/E5: when a slot becomes available again (isSlotLocked=false), employer can offer the freed slot to Candidate C', async () => {
      const { getByText, getByPlaceholderText } = await render(
        <ActionCard
          message={baseJobRequestMsg}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={11}
          conversationStatus="open"
          applicationStatus="pending_negotiation"
          hasRealMessageFromEmployer={true}
          isSlotLocked={false}
          onActionComplete={jest.fn()}
        />,
      );

      expect(getByText('Hire Decision')).toBeTruthy();
      await fireEvent.press(getByText('Hire'));
      expect(getByPlaceholderText('Enter agreed price (₱)...')).toBeTruthy();
      expect(getByText('Confirm Hire')).toBeTruthy();
    });

    it('E4: reserved worker with an active offer (employer_confirmed) can still respond even when isSlotLocked=true (0 unreserved slots remain)', async () => {
      const offerMsg: Message = {
        id: 202,
        conversation_id: 12,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'accept_or_reject',
        card_data: {
          application_id: 51,
          job_title: 'Masonry & Wall Plastering',
          employer_name: 'Engr. Roberto Santos',
          worker_name: 'Worker B',
          price: 650,
          final_agreed_price: 650,
        },
        card_resolved: false,
        created_at: '2026-10-01T01:00:00.000Z',
      };

      const { getByText, queryByText } = await render(
        <ActionCard
          message={offerMsg}
          currentUserId={22}
          currentUserRole="worker"
          conversationId={12}
          conversationStatus="open"
          applicationStatus="employer_confirmed"
          finalAgreedPrice={650}
          isSlotLocked={true}
          onActionComplete={jest.fn()}
        />,
      );

      // Reserved worker must NOT be blocked by position_filled banner; they hold the reservation
      expect(queryByText('Position Filled')).toBeNull();
      expect(getByText('Accept Offer')).toBeTruthy();
    });

    it('D8: two workers hired for the same job at different prices see their own distinct agreed price', async () => {
      const workerAConfirmedMsg: Message = {
        id: 301,
        conversation_id: 21,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'accept_or_reject',
        card_data: {
          application_id: 61,
          job_title: 'Masonry & Wall Plastering',
          price: 850,
          final_agreed_price: 850,
        },
        card_resolved: true,
        created_at: '2026-10-01T02:00:00.000Z',
      };

      const workerBConfirmedMsg: Message = {
        id: 302,
        conversation_id: 22,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'accept_or_reject',
        card_data: {
          application_id: 62,
          job_title: 'Masonry & Wall Plastering',
          price: 550,
          final_agreed_price: 550,
        },
        card_resolved: true,
        created_at: '2026-10-01T02:05:00.000Z',
      };

      const renderA = await render(
        <ActionCard
          message={workerAConfirmedMsg}
          currentUserId={31}
          currentUserRole="worker"
          conversationId={21}
          conversationStatus="open"
          applicationStatus="accepted"
          finalAgreedPrice={850}
          onActionComplete={jest.fn()}
        />,
      );

      const renderB = await render(
        <ActionCard
          message={workerBConfirmedMsg}
          currentUserId={32}
          currentUserRole="worker"
          conversationId={22}
          conversationStatus="open"
          applicationStatus="accepted"
          finalAgreedPrice={550}
          onActionComplete={jest.fn()}
        />,
      );

      expect(renderA.getByText('Agreed Price: ₱850.00')).toBeTruthy();
      expect(renderB.getByText('Agreed Price: ₱550.00')).toBeTruthy();
    });
  });

  // =========================================================================
  // SECTION F: Multi-Worker Completion & Independent Review States (F5, F6)
  // =========================================================================
  describe('Work, Completion, and Independent Ratings per Worker (F5, F6)', () => {
    it('F6: when Worker A is rated (hasReviewed=true) and Worker B is not yet rated (hasReviewed=false), their review CTAs remain independent', async () => {
      const completedCardA: Message = {
        id: 401,
        conversation_id: 31,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'flag_offline',
        card_data: {
          application_id: 71,
          job_id: 1,
          job_title: 'Masonry & Wall Plastering',
          worker_name: 'Worker A',
          employer_name: 'Engr. Roberto Santos',
          is_flagged: true,
        },
        card_resolved: true,
        created_at: '2026-10-02T00:00:00.000Z',
      };

      const completedCardB: Message = {
        ...completedCardA,
        id: 402,
        conversation_id: 32,
        card_data: {
          ...completedCardA.card_data,
          application_id: 72,
          worker_name: 'Worker B',
        },
      };

      const chatA = await render(
        <ActionCard
          message={completedCardA}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={31}
          conversationStatus="open"
          applicationStatus="completed"
          hasReviewed={true}
          onActionComplete={jest.fn()}
        />,
      );

      const chatB = await render(
        <ActionCard
          message={completedCardB}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={32}
          conversationStatus="open"
          applicationStatus="completed"
          hasReviewed={false}
          onActionComplete={jest.fn()}
        />,
      );

      // Worker A was already rated by employer -> no Rate Worker button in A's chat
      expect(chatA.queryByText('Rate Worker')).toBeNull();
      // Worker B has not been rated yet -> Rate Worker button is visible in B's chat
      expect(chatB.getByText('Rate Worker')).toBeTruthy();
    });
  });

  // =========================================================================
  // CODE RISKS VERIFICATION (Risks #2, #3, #4)
  // =========================================================================
  describe('Documented Code Risks Verification', () => {
    it('Risk #2: compares availability check logic between JobDetailsScreen and ApplyScreen when a job has a free slot', () => {
      const computeJobDetailsIsFilled = (job: Partial<JobPost>) => {
        const totalSlots = job?.slots || 1;
        const filledSlots = job?.filled_slots ?? (job?.accepted_count || 0);
        const remainingSlots = job?.remaining_slots ?? Math.max(0, totalSlots - filledSlots);
        return (
          remainingSlots === 0 ||
          job?.status === 'completed' ||
          job?.status === 'closed_in_progress'
        );
      };

      const computeApplyScreenIsFilled = (job: Partial<JobPost>) => {
        const totalSlots = job?.slots ?? 1;
        const filledSlots = job?.filled_slots ?? job?.accepted_count ?? 0;
        return (
          (job?.remaining_slots != null && job.remaining_slots <= 0) ||
          filledSlots >= totalSlots ||
          (job?.status != null && job.status !== 'open')
        );
      };

      // Standard open job with 1 of 2 slots free -> both agree it is NOT filled
      const openWithFreeSlot: Partial<JobPost> = {
        slots: 2,
        filled_slots: 1,
        remaining_slots: 1,
        status: 'open',
      };
      expect(computeJobDetailsIsFilled(openWithFreeSlot)).toBe(false);
      expect(computeApplyScreenIsFilled(openWithFreeSlot)).toBe(false);

      // Edge case Risk #2: if a job has a non-'open' status (e.g. 'in_progress') with 1 free slot,
      // JobDetailsScreen treats it as available (false) while ApplyScreen blocks it (true)
      const inProgressWithFreeSlot: Partial<JobPost> = {
        slots: 2,
        filled_slots: 1,
        remaining_slots: 1,
        status: 'in_progress' as any,
      };
      expect(computeJobDetailsIsFilled(inProgressWithFreeSlot)).toBe(false);
      expect(computeApplyScreenIsFilled(inProgressWithFreeSlot)).toBe(true);
    });

    it('Risk #3 (Scenario F4): a 2-slot job completed after hiring only 1 worker is labelled "All filled (2/2)" by JobCard logic', async () => {
      const partiallyFilledCompletedJob = createBaseJob({
        slots: 2,
        filled_slots: 1,
        remaining_slots: 1,
        accepted_count: 1,
        status: 'completed',
      });

      const { getByText } = await render(
        <JobCard job={partiallyFilledCompletedJob} onPress={jest.fn()} />,
      );

      // Because JobCard checks `job.status === 'completed'`, it renders `All filled (totalSlots/totalSlots)`
      expect(getByText('All filled (2/2)')).toBeTruthy();
    });

    it('Risk #4: ApplicationCard maps "rejected" to stage 0 (Closed / Position Filled), whereas ApplicationDetailScreen getStage defaults unknown/rejected status to Stage 1', () => {
      // ApplicationCard explicitly handles 'rejected'
      const cardStageInfo = getApplicationStageInfo('rejected');
      expect(cardStageInfo.stage).toBe(0);
      expect(cardStageInfo.badgeLabel).toBe('Closed');
      expect(cardStageInfo.stepLabel).toBe('Position Filled');

      // ApplicationDetailScreen's switch(status) falls back to `default: return 1` for 'rejected'
      const getDetailScreenStage = (status?: string) => {
        switch (status) {
          case 'pending':
            return 1;
          case 'shortlisted':
          case 'pending_negotiation':
          case 'employer_requested':
            return 2;
          case 'employer_confirmed':
            return 3;
          case 'accepted':
          case 'hired':
            return 4;
          case 'completed':
            return 5;
          default:
            return 1;
        }
      };
      expect(getDetailScreenStage('rejected')).toBe(1);
    });
  });

  // =========================================================================
  // SECTION M: Multi-Worker Staggered Completion & Slot Release (M01 - M22)
  // =========================================================================
  describe('Multi-Worker Staggered Completion & Slot Release (M01 - M22)', () => {
    it('M01, M06, M07, M08, M09, M18: when 2 of 3 workers have completed their work and the 3rd slot is open/released, JobCard shows "1 left" instead of "All filled"', async () => {
      const twoCompletedOneOpenJob = createBaseJob({
        slots: 3,
        filled_slots: 2,
        remaining_slots: 1,
        accepted_count: 2,
        status: 'open',
      });

      const { getByText, queryByText } = await render(
        <JobCard job={twoCompletedOneOpenJob} onPress={jest.fn()} />,
      );

      expect(getByText('1 left')).toBeTruthy();
      expect(queryByText('All filled (3/3)')).toBeNull();
    });

    it('M02, M03, M04, M05, M10: when 2 workers are completed and the 3rd slot is held by an accepted/reserved worker, JobCard shows "All filled (3/3)" while overall job status is still closed_in_progress', async () => {
      const twoCompletedOneActiveJob = createBaseJob({
        slots: 3,
        filled_slots: 3,
        remaining_slots: 0,
        accepted_count: 3,
        status: 'closed_in_progress',
      });

      const { getByText, queryByText } = await render(
        <JobCard job={twoCompletedOneActiveJob} onPress={jest.fn()} />,
      );

      expect(getByText('All filled (3/3)')).toBeTruthy();
      expect(queryByText('1 left')).toBeNull();
    });

    it('M11, M14: different workers viewing the same 3-slot job see their own individual status (Completed, Accepted/Applied, or Open vacancy)', async () => {
      // Worker A (completed) revisits the job while 1 slot is still open
      const jobForWorkerA = createBaseJob({
        slots: 3,
        filled_slots: 2,
        remaining_slots: 1,
        status: 'open',
        is_applied: true,
        application_status: 'completed' as any,
      });

      // Worker B (accepted/working) views the job
      const jobForWorkerB = createBaseJob({
        slots: 3,
        filled_slots: 2,
        remaining_slots: 1,
        status: 'open',
        is_applied: true,
        application_status: 'accepted' as any,
      });

      // New applicant views the job
      const jobForNewWorker = createBaseJob({
        slots: 3,
        filled_slots: 2,
        remaining_slots: 1,
        status: 'open',
        is_applied: false,
      });

      const viewA = await render(<JobCard job={jobForWorkerA} onPress={jest.fn()} />);
      const viewB = await render(<JobCard job={jobForWorkerB} onPress={jest.fn()} />);
      const viewNew = await render(<JobCard job={jobForNewWorker} onPress={jest.fn()} />);

      // Worker A and Worker B see "APPLIED" badge on the card (not a fresh unapplied card), while New Worker does not
      expect(viewA.getByText('APPLIED')).toBeTruthy();
      expect(viewB.getByText('APPLIED')).toBeTruthy();
      expect(viewNew.queryByText('APPLIED')).toBeNull();
      expect(viewNew.getByText('1 left')).toBeTruthy();

      // And ApplicationCard stage info keeps A at Stage 5 (Completed) and B at Stage 4 (Hired)
      expect(getApplicationStageInfo('completed').stage).toBe(5);
      expect(getApplicationStageInfo('accepted').stage).toBe(4);
    });

    it('M02, M12, M13: early-finishing Worker A shows completed & Rate Worker CTA in chat while Worker B remains in active work state with their own agreed price', async () => {
      const cardA: Message = {
        id: 501,
        conversation_id: 41,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'flag_offline',
        card_data: {
          application_id: 81,
          job_id: 1,
          job_title: 'Masonry & Wall Plastering',
          worker_name: 'Worker A',
          employer_name: 'Engr. Roberto Santos',
          is_flagged: true,
          final_agreed_price: 650,
        },
        card_resolved: true,
        created_at: '2026-10-03T00:00:00.000Z',
      };

      const cardB: Message = {
        id: 502,
        conversation_id: 42,
        sender_id: null,
        message_type: 'action_card',
        card_type: 'mark_complete',
        card_data: {
          application_id: 82,
          job_id: 1,
          job_title: 'Masonry & Wall Plastering',
          worker_name: 'Worker B',
          employer_name: 'Engr. Roberto Santos',
          final_agreed_price: 900,
        },
        card_resolved: false,
        created_at: '2026-10-03T00:05:00.000Z',
      };

      const chatA = await render(
        <ActionCard
          message={cardA}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={41}
          conversationStatus="open"
          applicationStatus="completed"
          finalAgreedPrice={650}
          hasReviewed={false}
          onActionComplete={jest.fn()}
        />,
      );

      const chatB = await render(
        <ActionCard
          message={cardB}
          currentUserId={10}
          currentUserRole="employer"
          conversationId={42}
          conversationStatus="open"
          applicationStatus="accepted"
          finalAgreedPrice={900}
          hasReviewed={false}
          onActionComplete={jest.fn()}
        />,
      );

      // Worker A's chat shows Completed + Rate Worker CTA
      expect(chatA.getByText('Rate Worker')).toBeTruthy();
      // Worker B's chat still shows the active "Mark as Completed" button (NOT completed or Rate Worker)
      expect(chatB.queryByText('Rate Worker')).toBeNull();
      expect(chatB.getAllByText('Mark as Completed').length).toBeGreaterThan(0);
    });
  });
});
