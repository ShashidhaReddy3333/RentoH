require('dotenv').config({ path: '.env.test' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const landlordEmail = 'landlord+e2e@example.com';
  const tenantEmail = 'tenant+e2e@example.com';

  console.log('🔄 Creating test users...');
  
  // Create users (auto-confirm)
  const landlordResult = await admin.auth.admin.createUser({ 
    email: landlordEmail, 
    password: 'Pass@1234', 
    email_confirm: true 
  });
  
  const tenantResult = await admin.auth.admin.createUser({ 
    email: tenantEmail, 
    password: 'Pass@1234', 
    email_confirm: true 
  });

  const landlordId = landlordResult.data.user?.id;
  const tenantId = tenantResult.data.user?.id;

  if (!landlordId || !tenantId) {
    console.error('❌ Failed to create users');
    process.exit(1);
  }

  console.log(`✅ Users created: landlord=${landlordId}, tenant=${tenantId}`);

  // Upsert profiles with roles
  console.log('🔄 Creating profiles...');
  const profileResult = await admin.from('profiles').upsert([
    { id: landlordId, email: landlordEmail, full_name: 'E2E Landlord', role: 'landlord' },
    { id: tenantId,   email: tenantEmail,   full_name: 'E2E Tenant',   role: 'tenant'   },
  ]);
  
  if (profileResult.error) {
    console.error('❌ Profile creation error:', profileResult.error);
    process.exit(1);
  }
  
  console.log('✅ Profiles created');

  // Seed one active property
  console.log('🔄 Creating test property...');
  const propertyResult = await admin.from('properties').insert([{
    landlord_id: landlordId,
    title: 'E2E Test Listing',
    description: 'Nice QA home.',
    price: 2100,
    beds: 2, baths: 1,
    city: 'Kitchener',
    status: 'active',
    address: '123 QA St',
    postal_code: 'N2J 3Z4',
    rent_frequency: 'monthly',
    type: 'apartment'
  }]).select('id').single();
  
  if (propertyResult.error) {
    console.error('❌ Property creation error:', propertyResult.error);
    process.exit(1);
  }
  
  console.log(`✅ Property created: id=${propertyResult.data.id}`);

  console.log('\n✅ E2E seed complete - ready for testing!');
})();
