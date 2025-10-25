'use client';

import { useState } from 'react';
import { routes } from '@/lib/routes';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
  userId: string;
}

export function PropertyApplicationForm({ propertyId, landlordId, propertyTitle, userId }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          property_id: propertyId,
          landlord_id: landlordId,
          applicant_id: userId,
          monthly_income: parseInt(formData.monthlyIncome),
          message: formData.message,
          status: 'submitted',
        });

      if (error) throw error;

      // trigger digest for landlord (dev stub)
      try {
        await fetch('/api/digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: landlordId, reason: 'application' })
        });
      } catch (e) {
        console.error('Digest trigger failed', e);
      }

      router.push(routes.applications as any);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-6">Apply for {propertyTitle}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              id="monthlyIncome"
              required
              className="pl-7 block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.monthlyIncome}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
              placeholder="5000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message to Landlord
          </label>
          <textarea
            id="message"
            required
            className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Introduce yourself and explain why you would be a great tenant..."
          />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Card>
  );
}