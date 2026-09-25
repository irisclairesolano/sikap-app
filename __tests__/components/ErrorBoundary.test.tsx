import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test crash in ProblemChild');
  }
  return <Text>Child rendered successfully</Text>;
};

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Silence React's internal console.error during error boundary test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', async () => {
    const { getByText, queryByTestId } = await render(
      <ErrorBoundary>
        <Text>Normal content</Text>
      </ErrorBoundary>,
    );

    expect(getByText('Normal content')).toBeTruthy();
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('catches render errors and displays fallback UI with Try Again and Return to Home buttons', async () => {
    const { getByText, getByTestId } = await render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test crash in ProblemChild')).toBeTruthy();
    expect(getByTestId('error-boundary-try-again')).toBeTruthy();
    expect(getByTestId('error-boundary-return-home')).toBeTruthy();
  });

  it('calls onReset when Try Again is pressed', async () => {
    const onResetMock = jest.fn();
    const { getByTestId } = await render(
      <ErrorBoundary onReset={onResetMock}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    const tryAgainBtn = getByTestId('error-boundary-try-again');
    fireEvent.press(tryAgainBtn);

    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  it('calls onHome when Return to Home is pressed', async () => {
    const onHomeMock = jest.fn();
    const { getByTestId } = await render(
      <ErrorBoundary onHome={onHomeMock}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    const homeBtn = getByTestId('error-boundary-return-home');
    fireEvent.press(homeBtn);

    expect(onHomeMock).toHaveBeenCalledTimes(1);
  });
});
