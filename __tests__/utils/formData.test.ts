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
    expect(appendedBlob.uri).toBe('file:///path/to/id.jpg');
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

  describe('ensureExtension', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ensureExtension } = require('../../src/utils/formData');

    it('normalizes JPEG extensions properly for various MIME types', () => {
      expect(ensureExtension('my-id.jpg', 'image/jpeg')).toBe('my-id.jpg');
      expect(ensureExtension('my-id.jpeg', 'image/jpeg')).toBe('my-id.jpeg');
      expect(ensureExtension('photo.jfif', 'image/jpeg')).toBe('photo.jpg');
      expect(ensureExtension('image_capture.heic', 'image/jpeg')).toBe('image_capture.jpg');
      expect(ensureExtension('1000012345.1', 'image/jpeg')).toBe('1000012345.jpg');
      expect(ensureExtension('no_extension', 'image/jpeg')).toBe('no_extension.jpg');
    });

    it('normalizes PNG and PDF extensions properly', () => {
      expect(ensureExtension('document', 'application/pdf')).toBe('document.pdf');
      expect(ensureExtension('document.pdf', 'application/pdf')).toBe('document.pdf');
      expect(ensureExtension('logo', 'image/png')).toBe('logo.png');
      expect(ensureExtension('logo.png', 'image/png')).toBe('logo.png');
    });

    it('preserves valid known image extensions when mime type is not explicit', () => {
      expect(ensureExtension('photo.webp', '')).toBe('photo.webp');
      expect(ensureExtension('photo.heic', '')).toBe('photo.heic');
    });
  });
});
