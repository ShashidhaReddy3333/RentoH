'use client';

import { useState, useTransition } from 'react';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { buttonStyles } from '@/components/ui/button';
import { updateApplicationStatus } from './actions';

type ApplicationActionsProps = {
  applicationId: string;
  currentStatus: string;
};

function showToast(message: string, opts: { success?: boolean } = {}) {
  const id = `rento-toast-${Date.now()}`;
  const el = document.createElement('div');
  el.id = id;
  el.className = 'fixed bottom-6 right-6 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-lg';
  el.style.background = opts.success ? '#DCFCE7' : '#FEF3C7';
  el.style.color = '#0f172a';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 180ms ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

export default function ApplicationActions({ applicationId, currentStatus }: ApplicationActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    if (isPending) return;
    
    setBusyAction(newStatus);
    startTransition(async () => {
      try {
        const result = await updateApplicationStatus(applicationId, newStatus);
        
        if (result.success) {
          showToast(`Application ${newStatus}`, { success: true });
          // Page will revalidate automatically due to server action
        } else {
          showToast(result.error || 'Failed to update application');
        }
      } catch (error) {
        console.error('Error updating application:', error);
        showToast('An unexpected error occurred');
      } finally {
        setBusyAction(null);
      }
    });
  };

  const getAvailableActions = () => {
    const actions: Array<{ status: string; label: string; icon: typeof CheckCircleIcon; variant: 'primary' | 'secondary' | 'ghost' | 'danger' }> = [];

    if (currentStatus === 'submitted') {
      actions.push({ status: 'reviewing', label: 'Mark as Reviewing', icon: EyeIcon, variant: 'ghost' });
      actions.push({ status: 'approved', label: 'Approve', icon: CheckCircleIcon, variant: 'primary' });
      actions.push({ status: 'rejected', label: 'Reject', icon: XCircleIcon, variant: 'danger' });
    } else if (currentStatus === 'reviewing') {
      actions.push({ status: 'interview', label: 'Schedule Interview', icon: EyeIcon, variant: 'secondary' });
      actions.push({ status: 'approved', label: 'Approve', icon: CheckCircleIcon, variant: 'primary' });
      actions.push({ status: 'rejected', label: 'Reject', icon: XCircleIcon, variant: 'danger' });
    } else if (currentStatus === 'interview') {
      actions.push({ status: 'approved', label: 'Approve', icon: CheckCircleIcon, variant: 'primary' });
      actions.push({ status: 'rejected', label: 'Reject', icon: XCircleIcon, variant: 'danger' });
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        No actions available for this application status.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        const isBusy = busyAction === action.status;
        
        return (
          <button
            key={action.status}
            type="button"
            onClick={() => handleStatusChange(action.status)}
            disabled={isPending}
            className={buttonStyles({ variant: action.variant })}
          >
            {isBusy ? (
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Icon className="h-5 w-5" />
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
