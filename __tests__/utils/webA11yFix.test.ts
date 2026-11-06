import { Platform } from 'react-native';

describe('webA11yFix', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    (Platform as any).OS = originalPlatform;
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).Element;
    delete (globalThis as any).HTMLElement;
    jest.resetModules();
  });

  it('safely handles non-web environments without throwing', () => {
    const { initWebA11yFix, blurActiveElementOnWeb } = require('../../src/utils/webA11yFix');
    (Platform as any).OS = 'android';
    expect(() => initWebA11yFix()).not.toThrow();
    expect(() => blurActiveElementOnWeb()).not.toThrow();
  });

  it('blurs descendant activeElement when aria-hidden="true" is applied on Web', () => {
    (Platform as any).OS = 'web';

    const childButton = {
      blur: jest.fn(),
    };

    const containerChildren = [childButton];
    const container = {
      contains: jest.fn((node: any) => containerChildren.includes(node)),
      setAttribute: jest.fn(),
    };

    const mockDocument: any = {
      body: {},
      activeElement: childButton,
    };

    class MockElement {
      setAttribute(name: string, value: string) {
        return (this as any)._attrs?.[name] || value;
      }
    }
    class MockHTMLElement extends MockElement {}

    (globalThis as any).window = {};
    (globalThis as any).document = mockDocument;
    (globalThis as any).Element = MockElement;
    (globalThis as any).HTMLElement = MockHTMLElement;

    const { initWebA11yFix } = require('../../src/utils/webA11yFix');
    initWebA11yFix();

    // Invoke patched setAttribute on container with container as `this`
    MockElement.prototype.setAttribute.call(container as any, 'aria-hidden', 'true');

    expect(childButton.blur).toHaveBeenCalled();
  });

  it('does not blur if activeElement is outside the container', () => {
    (Platform as any).OS = 'web';

    const outsideButton = {
      blur: jest.fn(),
    };

    const container = {
      contains: jest.fn(() => false),
      setAttribute: jest.fn(),
    };

    const mockDocument: any = {
      body: {},
      activeElement: outsideButton,
    };

    class MockElement {
      setAttribute(name: string, value: string) {
        return value;
      }
    }
    class MockHTMLElement extends MockElement {}

    (globalThis as any).window = {};
    (globalThis as any).document = mockDocument;
    (globalThis as any).Element = MockElement;
    (globalThis as any).HTMLElement = MockHTMLElement;

    const { initWebA11yFix } = require('../../src/utils/webA11yFix');
    initWebA11yFix();

    MockElement.prototype.setAttribute.call(container as any, 'aria-hidden', 'true');

    expect(outsideButton.blur).not.toHaveBeenCalled();
  });

  it('blurActiveElementOnWeb blurs activeElement if on web and not body', () => {
    (Platform as any).OS = 'web';

    const mockButton = {
      blur: jest.fn(),
    };

    const mockDocument: any = {
      body: {},
      activeElement: mockButton,
    };

    (globalThis as any).window = {};
    (globalThis as any).document = mockDocument;

    const { blurActiveElementOnWeb } = require('../../src/utils/webA11yFix');
    blurActiveElementOnWeb();

    expect(mockButton.blur).toHaveBeenCalled();
  });
});
