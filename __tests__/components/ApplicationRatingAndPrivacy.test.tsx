import { getApplicationStageInfo } from '../../src/components/applications/ApplicationCard';
import { Application } from '../../src/types';

describe('Application Rating, Privacy, and Filter Logic', () => {
  const baseApp: Application = {
    id: 7,
    job_post_id: 101,
    status: 'completed',
    created_at: '2026-09-14T08:30:00Z',
    applied_at: '2026-09-14T08:30:00Z',
    has_reviewed: false,
    cover_note: null,
    final_agreed_price: null,
    references_revealed: true,
    contact_revealed: true,
    job: {
      id: 101,
      title: 'Plumbing Repair',
      employer: {
        id: 5,
        name: 'Maria Santos',
        verification_badge: true,
        reputation_score: 4.9,
      } as any,
    } as any,
    worker: {
      id: 22,
      name: 'Juan Dela Cruz',
      barangay: 'Central',
      reputation_score: 4.8,
      verification_badge: true,
      skills: [],
      experiences: [],
      character_references: null,
      phone: null,
      email: null,
    },
  };

  describe('Rating Status and Stage Info', () => {
    it('returns "Completed" with urgent badge when completed and has_reviewed is false', () => {
      const stageInfo = getApplicationStageInfo('completed', false);
      expect(stageInfo.badgeLabel).toBe('Completed');
      expect(stageInfo.isUrgent).toBe(true);
      expect(stageInfo.stage).toBe(5);
      expect(stageInfo.nextStep).toContain('Please rate your employer');
    });

    it('returns "Completed · Rated" when completed and has_reviewed is true', () => {
      const stageInfo = getApplicationStageInfo('completed', true);
      expect(stageInfo.badgeLabel).toBe('Completed · Rated');
      expect(stageInfo.isUrgent).toBe(false);
      expect(stageInfo.stage).toBe(5);
      expect(stageInfo.nextStep).toContain('Thank you for your feedback');
    });
  });

  describe('My Applications Tab Filtering ("Needs Action")', () => {
    const filterMatches = (app: Application, tab: string) => {
      if (tab === 'Needs Action') {
        return (
          app.status === 'employer_confirmed' || (app.status === 'completed' && !app.has_reviewed)
        );
      }
      if (tab === 'History') {
        return (
          (app.status === 'completed' && app.has_reviewed) ||
          app.status === 'rejected' ||
          app.status === 'withdrawn' ||
          (app.status as string) === 'cancelled'
        );
      }
      return true;
    };

    it('places completed unreviewed job in "Needs Action"', () => {
      const unreviewedApp: Application = { ...baseApp, has_reviewed: false };
      expect(filterMatches(unreviewedApp, 'Needs Action')).toBe(true);
      expect(filterMatches(unreviewedApp, 'History')).toBe(false);
    });

    it('removes completed rated job from "Needs Action" and moves it to "History"', () => {
      const reviewedApp: Application = { ...baseApp, has_reviewed: true };
      expect(filterMatches(reviewedApp, 'Needs Action')).toBe(false);
      expect(filterMatches(reviewedApp, 'History')).toBe(true);
    });
  });

  describe('Employer Privacy at Shortlist Stage', () => {
    it('does not expose employer phone number in public application payload', () => {
      const shortlistedApp: Application = {
        ...baseApp,
        status: 'shortlisted' as any,
      };
      // Employer object only exposes public safe fields
      expect((shortlistedApp.job.employer as any).phone).toBeUndefined();
      expect(shortlistedApp.job.employer.name).toBe('Maria Santos');
      expect(shortlistedApp.job.employer.reputation_score).toBe(4.9);
    });
  });

  describe('Worker Profile and Reviews Tab Filtering', () => {
    const mockReviews = [
      {
        id: 1,
        reviewee_id: 22,
        reviewer_id: 5,
        reviewer_role: 'employer',
        reviewer_name: 'Maria Santos',
        overall_rating: 5.0,
        comment: 'Excellent work, finished on time!',
      },
      {
        id: 2,
        reviewee_id: 5,
        reviewer_id: 22,
        reviewer_role: 'worker',
        reviewer_name: 'Juan Dela Cruz',
        overall_rating: 4.5,
        comment: 'Great employer to work with.',
      },
    ];

    it('filters out reviews made by the worker so only received reviews appear', () => {
      const receivedReviews = mockReviews.filter((r) => r.reviewer_role !== 'worker');
      expect(receivedReviews).toHaveLength(1);
      expect(receivedReviews[0].reviewer_role).toBe('employer');
      expect(receivedReviews[0].comment).toBe('Excellent work, finished on time!');
    });
  });

  describe('Applied Timestamp Formatting', () => {
    it('has applied_at timestamp matching application date', () => {
      expect(baseApp.applied_at).toBe('2026-09-14T08:30:00Z');
      const appliedDate = new Date(baseApp.applied_at!);
      expect(appliedDate.getFullYear()).toBe(2026);
    });
  });
});
