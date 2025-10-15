import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import BadgeVerified from '@/components/badge-verified';
import { Button, buttonStyles } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Property } from '@/lib/mock';

type CardVariant = 'default' | 'plain';

type PropertyCardProps = {
  property: Property;
  onSave?: (id: string) => void;
  saved?: boolean;
  className?: string;
  variant?: CardVariant;
};

export default function PropertyCard({
  property,
  onSave,
  saved,
  className,
  variant = 'default'
}: PropertyCardProps) {
  const primaryImage = property.images[0];

  if (variant === 'plain') {
    return (
      <div
        className={clsx(
          'flex flex-col gap-3 overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-surface/60',
          className
        )}
      >
        <MediaSection
          primaryImage={primaryImage}
          title={property.title}
          verified={property.verified}
          saved={saved}
          onSave={() => onSave?.(property.id)}
        />
        <DetailsSection property={property} />
        <Actions propertyId={property.id} />
      </div>
    );
  }

  return (
    <Card className={clsx('flex flex-col overflow-hidden', className)}>
      <MediaSection
        primaryImage={primaryImage}
        title={property.title}
        verified={property.verified}
        saved={saved}
        onSave={() => onSave?.(property.id)}
      />
      <CardContent className="flex flex-col gap-3">
        <DetailsSection property={property} />
        <Actions propertyId={property.id} />
      </CardContent>
    </Card>
  );
}

function MediaSection({
  primaryImage,
  title,
  verified,
  saved,
  onSave
}: {
  primaryImage?: string;
  title: string;
  verified?: boolean;
  saved?: boolean;
  onSave: () => void;
}) {
  return (
    <div className="relative aspect-video w-full bg-surface-muted">
      {primaryImage ? (
        <Image
          src={primaryImage}
          alt={`${title} photo`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-textc/60">
          Image coming soon
        </div>
      )}
      <div className="absolute left-3 top-3">{verified ? <BadgeVerified /> : null}</div>
      <Button
        type="button"
        variant="ghost"
        className={clsx(
          'absolute right-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-medium shadow-soft hover:bg-surface-muted',
          saved && 'text-brand.primary'
        )}
        aria-pressed={saved}
        onClick={onSave}
      >
        {saved ? '\u2665 Saved' : '\u2661 Save'}
      </Button>
    </div>
  );
}

function DetailsSection({ property }: { property: Property }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-lg font-semibold text-textc">{property.title}</h3>
      <p className="text-sm text-textc/70">
        {property.city} - ${property.rent}/mo
      </p>
    </div>
  );
}

function Actions({ propertyId }: { propertyId: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/listings/${propertyId}`}
        className={clsx(buttonStyles({ variant: 'outline' }), 'flex-1 text-center')}
      >
        View details
      </Link>
      <Link
        href="/messages"
        className={clsx(buttonStyles({ variant: 'ghost' }), 'flex-1 text-center')}
      >
        Message
      </Link>
    </div>
  );
}
