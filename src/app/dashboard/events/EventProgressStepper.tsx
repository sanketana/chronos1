"use client";
import React from 'react';
import { EVENT_STATUSES, getStatusInfo, getStatusDescription } from './EventStatusHelpers';

interface EventProgressStepperProps {
    currentStatus: string;
    eventName: string;
    eventDate?: string;
}

export default function EventProgressStepper({ currentStatus, eventName, eventDate }: EventProgressStepperProps) {
    const steps = Object.values(EVENT_STATUSES);

    const currentIndex = steps.findIndex(step => step.key === currentStatus);

    const statusInfo = getStatusInfo(currentStatus);

    return (
        <div className={`mb-6 p-6 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg`}>
            {/* Event Header */}
            <div className="mb-4">
                <h3 className={`text-xl font-bold ${statusInfo.color}`}>{eventName}</h3>
                {eventDate && (
                    <p className={`text-sm ${statusInfo.color} opacity-75`}>
                        Scheduled for {new Date(eventDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                )}
            </div>

            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isUpcoming = index > currentIndex;

                    return (
                        <React.Fragment key={step.key}>
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold border-2
                                    ${isCompleted
                                        ? 'bg-green-500 text-white border-green-500'
                                        : isCurrent
                                            ? `bg-white ${statusInfo.color} ${statusInfo.borderColor} border-2`
                                            : 'bg-gray-200 text-gray-500 border-gray-300'
                                    }
                                `}>
                                    {isCompleted ? '✓' : step.icon}
                                </div>
                                <div className="mt-2 text-center">
                                    <div className={`text-sm font-semibold ${isCurrent ? statusInfo.color :
                                        isCompleted ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        {step.label}
                                    </div>
                                    <div className={`text-xs ${isCurrent ? statusInfo.color :
                                        isCompleted ? 'text-green-500' : 'text-gray-400'
                                        } opacity-75`}>
                                        {step.description}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Current Status Description */}
            <div className={`p-3 rounded-md bg-white border ${statusInfo.borderColor}`}>
                <div className={`text-sm ${statusInfo.color}`}>
                    <strong>Current Status:</strong> {steps[currentIndex]?.label || currentStatus}
                </div>
                <div className={`text-xs text-gray-600 mt-1`}>
                    {getStatusDescription(currentStatus)}
                </div>
            </div>
        </div>
    );
}

