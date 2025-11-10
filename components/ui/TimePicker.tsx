'use client';

import { useState, useRef, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  'aria-describedby'?: string;
};

const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  const startHour = 9; // 9 AM
  const endHour = 19; // 7 PM
  const intervals = [0, 15, 30, 45]; // 15-minute increments

  for (let hour = startHour; hour <= endHour; hour++) {
    for (const minute of intervals) {
      if (hour === endHour && minute > 0) break; // Stop at 7:00 PM
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      times.push(`${hourStr}:${minuteStr}`);
    }
  }

  return times;
};

const formatTimeDisplay = (time: string): string => {
  if (!time) return 'Select time';
  
  const [hourStr, minuteStr] = time.split(':');
  if (!hourStr || !minuteStr) return 'Select time';
  
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute} ${period}`;
};

export function TimePicker({ 
  value, 
  onChange, 
  id, 
  name, 
  required = false, 
  className,
  'aria-describedby': ariaDescribedBy 
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const timeOptions = generateTimeOptions();

  const filteredOptions = timeOptions.filter(time => 
    formatTimeDisplay(time).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && value && listRef.current) {
      const selectedIndex = timeOptions.indexOf(value);
      if (selectedIndex >= 0) {
        const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
        selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isOpen, value, timeOptions]);

  const handleSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (!isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'w-full rounded-lg border border-brand-outline/60 bg-surface px-3 py-2',
          'text-left text-sm text-brand-dark shadow-sm transition',
          'hover:border-brand-primary/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-60',
          !value && 'text-text-muted'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select time"
      >
        <div className="flex items-center justify-between">
          <span>{formatTimeDisplay(value)}</span>
          <ClockIcon className="h-5 w-5 text-text-muted" aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-brand-outline/60 bg-white shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-brand-outline/60 bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              autoFocus
            />
          </div>
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto"
            aria-label="Available times"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  role="option"
                  aria-selected={time === value}
                  onClick={() => handleSelect(time)}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm transition',
                    'hover:bg-brand-primaryMuted focus-visible:bg-brand-primaryMuted',
                    'focus-visible:outline-none',
                    time === value
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-brand-dark'
                  )}
                >
                  {formatTimeDisplay(time)}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-sm text-text-muted">
                No matching times found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
