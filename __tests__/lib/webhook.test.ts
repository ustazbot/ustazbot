import { fireWebhook } from '@/lib/webhook';

describe('fireWebhook', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({} as Response);
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    delete process.env.MAKE_WEBHOOK_URL;
  });

  it('does nothing if MAKE_WEBHOOK_URL is not set', () => {
    fireWebhook({ event: 'test' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls fetch with correct URL and body when URL is set', () => {
    process.env.MAKE_WEBHOOK_URL = 'https://hook.make.com/test';
    fireWebhook({ event: 'test', foo: 'bar' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hook.make.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test', foo: 'bar' }),
      }),
    );
  });

  it('does not throw if fetch rejects', async () => {
    process.env.MAKE_WEBHOOK_URL = 'https://hook.make.com/test';
    fetchMock.mockRejectedValue(new Error('network'));
    fireWebhook({ event: 'test' });
    await Promise.resolve(); // flush microtasks so rejection settles through .catch()
  });
});
