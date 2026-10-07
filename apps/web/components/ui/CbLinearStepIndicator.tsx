/**
 * Crowdbeats V2 — Stitch Authoritative Linear Step Indicator (Project 5326179813018056505)
 * 4-step progress bar displaying completed checkmarks, current active step, and labels.
 */

import React from 'react';

export interface CbLinearStepIndicatorProps {
  currentStep: number; // 1 to totalSteps
  totalSteps?: number;
  stepLabels?: string[];
  className?: string;
}

export const CbLinearStepIndicator: React.FC<CbLinearStepIndicatorProps> = ({
  currentStep,
  totalSteps = 4,
  stepLabels = ['Basic Info', 'Your Preferences', 'Profile Details', 'Review'],
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Steps bar */}
      <div className="flex items-center justify-between w-full">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              {/* Step Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                  isCompleted || isActive
                    ? 'bg-[#7C3AED] text-white border-2 border-[#A855F7] shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                    : 'bg-[#282A42] text-[#64748B] border border-[#2B2D44]'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              {/* Connecting Line */}
              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 transition-all duration-150 ${
                    isCompleted ? 'bg-[#7C3AED]' : 'bg-[#2B2D44]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Label Row */}
      {currentStep <= stepLabels.length && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#A855F7]">
            {stepLabels[currentStep - 1]}
          </span>
          <span className="text-[#64748B]">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      )}
    </div>
  );
};
