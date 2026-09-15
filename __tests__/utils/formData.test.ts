import { appendFileToFormData } from '../../src/utils/formData';

declare const global: any;

describe('appendFileToFormData', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully appends blob with writable name and type without throwing getter error', async () => {
    const mockBlob = new Blob(['sample-file-content'], { type: 'image/jpeg' });
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    } as any);

    const formData = new FormData();
    const appendSpy = jest.spyOn(formData, 'append');

    await appendFileToFormData(
      formData,
      'id_file',
      'file:///path/to/id.jpg',
      'my-id.jpg',
      'image/jpeg',
    );

    expect(appendSpy).toHaveBeenCalledWith('id_file', expect.any(Blob), 'my-id.jpg');
    const appendedBlob: any = appendSpy.mock.calls[0][1];
    expect(appendedBlob.name).toBe('my-id.jpg');
    expect(appendedBlob.type).toBe('image/jpeg');
  });

  it('does not throw when Blob/File prototype has a getter-only name property', async () => {
    // Simulate Hermes / Expo environment where prototype has getter without setter
    class GetterOnlyBlob extends Blob {
      constructor() {
        super(['dummy-content'], { type: 'image/jpeg' });
      }
      get name() {
        return 'default-getter-name';
      }
    }

    const mockBlob = new GetterOnlyBlob();
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    } as any);

    const formData = new FormData();
    const appendSpy = jest.spyOn(formData, 'append');

    await expect(
      appendFileToFormData(
        formData,
        'selfie_file',
        'file:///path/to/selfie.jpg',
        'my-selfie.jpg',
        'image/jpeg',
      ),
    ).resolves.not.toThrow();

    expect(appendSpy).toHaveBeenCalledWith('selfie_file', expect.anything(), 'my-selfie.jpg');
  });

  it('ensures proper file extension if not provided in filename', async () => {
    const mockBlob = new Blob(['sample-file-content'], { type: 'image/jpeg' });
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    } as any);

    const formData = new FormData();
    const appendSpy = jest.spyOn(formData, 'append');

    await appendFileToFormData(
      formData,
      'id_file',
      'file:///path/to/id',
      'government-id-front',
      'image/jpeg',
    );

    expect(appendSpy).toHaveBeenCalledWith('id_file', expect.any(Blob), 'government-id-front.jpg');
  });

  it('falls back safely to RN object descriptor if fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Local file read failed'));

    const formData = new FormData();
    const appendSpy = jest.spyOn(formData, 'append');

    await appendFileToFormData(
      formData,
      'selfie_file',
      'file:///path/to/selfie.jpg',
      'selfie.jpg',
      'image/jpeg',
    );

    expect(appendSpy).toHaveBeenCalledWith('selfie_file', {
      uri: 'file:///path/to/selfie.jpg',
      name: 'selfie.jpg',
      type: 'image/jpeg',
    });
  });
});
