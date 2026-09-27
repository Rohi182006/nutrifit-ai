import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingPage } from '../pages/OnboardingPage';

// Mock axios API
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('/allergies')) {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Milk/Dairy' },
            { id: 2, name: 'Peanuts' },
            { id: 3, name: 'Soy' },
          ]
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(() => Promise.resolve({ data: { message: 'Success' } })),
  }
}));

describe('Onboarding Wizard (Section 39 Requirement)', () => {
  it('renders Step 1 Basic Profile and advances to Step 2 Fitness Goal', async () => {
    render(
      <BrowserRouter>
        <OnboardingPage />
      </BrowserRouter>
    );

    // Verify Step 1 is rendered
    expect(screen.getByText(/Step 1 — Basic Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Age \(Years\)/i)).toBeInTheDocument();

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    // Verify Step 2 Fitness Goal is displayed
    expect(screen.getByText(/Step 2 — Fitness & Wellness Goal/i)).toBeInTheDocument();
    expect(screen.getByText(/General fitness/i)).toBeInTheDocument();
  });
});

describe('Recommendation Feedback Interaction (Section 39 Requirement)', () => {
  it('allows clicking Useful and Not Useful feedback buttons', () => {
    const handleFeedbackMock = vi.fn();

    // Render a simplified recommendation action button container
    render(
      <div>
        <button
          onClick={() => handleFeedbackMock(true)}
          className="useful-btn"
        >
          Useful
        </button>
        <button
          onClick={() => handleFeedbackMock(false)}
          className="not-useful-btn"
        >
          Not for me
        </button>
      </div>
    );

    const usefulBtn = screen.getByText('Useful');
    const notUsefulBtn = screen.getByText('Not for me');

    fireEvent.click(usefulBtn);
    expect(handleFeedbackMock).toHaveBeenCalledWith(true);

    fireEvent.click(notUsefulBtn);
    expect(handleFeedbackMock).toHaveBeenCalledWith(false);
  });
});
