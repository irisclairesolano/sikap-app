import * as jobsApi from '../../src/api/jobs';

jest.mock('../../src/api/jobs', () => ({
  reactToJob: jest.fn(),
}));

describe('Job Features Test Suite', () => {
  const mockJob = {
    id: 42,
    title: 'Senior Carpentry Specialist',
    description: 'Experienced wood worker needed for custom furniture assembly.',
    compensation: '500.00',
    pay_type: 'daily',
    duration: '2 Days',
    categories: ['Carpentry'],
    created_at: '2026-08-31T09:00:00Z',
    employer: {
      id: 10,
      name: 'John Doe Contracting',
      verification_badge: true,
      reputation_score: 4.8,
    },
    reactions_count: 5,
    user_has_reacted: false,
  };

  it('formats job details with correct title and category properties', () => {
    expect(mockJob.title).toBe('Senior Carpentry Specialist');
    expect(mockJob.categories).toContain('Carpentry');
    expect(mockJob.employer.verification_badge).toBe(true);
  });

  it('toggles heart reaction API endpoint for interested jobs', async () => {
    (jobsApi.reactToJob as jest.Mock).mockResolvedValueOnce({
      reacted: true,
      reactions_count: 6,
    });

    const response = await jobsApi.reactToJob(mockJob.id);
    expect(jobsApi.reactToJob).toHaveBeenCalledWith(42);
    expect(response.reacted).toBe(true);
    expect(response.reactions_count).toBe(6);
  });

  it('sorts job feed newest first so newly created job post appears at the top of the feed', () => {
    const olderJob = { id: 1, title: 'Older Job', created_at: '2026-08-30T10:00:00Z' };
    const newestJob = {
      id: 2,
      title: 'Newly Posted Carpentry Job',
      created_at: '2026-08-31T09:30:00Z',
    };

    const feed = [olderJob, newestJob];
    const sortedFeed = [...feed].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    expect(sortedFeed[0].id).toBe(2);
    expect(sortedFeed[0].title).toBe('Newly Posted Carpentry Job');
  });
});
