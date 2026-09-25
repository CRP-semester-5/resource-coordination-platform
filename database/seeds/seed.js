/**
 * ResQ Hub — Automated Database Test Seeder
 * Purpose: Populates predictable, idempotent test datasets for Section 3.1.1 testing.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);

export async function seedTestData() {
  console.log('🌱 Starting database test fixture seeding...');

  // 1. Seed Organizations
  const { error: orgErr } = await supabase.from('organizations').upsert([
    {
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      tenant_id: 'b0000000-0000-0000-0000-000000000001',
      organization_name: 'Red Cross Colombo Hub',
      description: 'Emergency disaster response division',
      email: 'colombo@redcross.org',
      phone: '+94112345678',
      status: 'ACTIVE'
    },
    {
      organization_id: 'a0000000-0000-0000-0000-000000000002',
      tenant_id: 'b0000000-0000-0000-0000-000000000002',
      organization_name: 'Sarvodaya Relief Foundation',
      description: 'Community volunteer coordination division',
      email: 'relief@sarvodaya.org',
      phone: '+94112345679',
      status: 'ACTIVE'
    }
  ], { onConflict: 'organization_id' });

  if (orgErr) console.warn('Org seed warning:', orgErr.message);

  // 2. Seed Users
  const { error: userErr } = await supabase.from('users').upsert([
    {
      user_id: 'c0000000-0000-0000-0000-000000000001',
      first_name: 'Kasun',
      last_name: 'Perera',
      email: 'kasun.coordinator@resqhub.test',
      phone: '+94771234567',
      status: 'ACTIVE'
    },
    {
      user_id: 'c0000000-0000-0000-0000-000000000002',
      first_name: 'Nuwan',
      last_name: 'Silva',
      email: 'nuwan.citizen@resqhub.test',
      phone: '+94772345678',
      status: 'ACTIVE'
    },
    {
      user_id: 'c0000000-0000-0000-0000-000000000003',
      first_name: 'Amara',
      last_name: 'Fernando',
      email: 'amara.volunteer@resqhub.test',
      phone: '+94773456789',
      status: 'ACTIVE'
    }
  ], { onConflict: 'user_id' });

  if (userErr) console.warn('User seed warning:', userErr.message);

  // 3. Seed Organization Members
  const { error: memberErr } = await supabase.from('organization_members').upsert([
    {
      organization_member_id: 'd0000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      user_id: 'c0000000-0000-0000-0000-000000000001',
      role: 'COORDINATOR',
      status: 'ACTIVE'
    }
  ], { onConflict: 'organization_id,user_id' });

  if (memberErr) console.warn('Member seed warning:', memberErr.message);

  // 4. Seed Resources (Warehouse Inventory)
  const { error: resErr } = await supabase.from('resources').upsert([
    {
      resource_id: 'f0000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      resource_name: 'Mineral Water 5L',
      category: 'Water & Sanitation',
      quantity_available: 250,
      quantity_reserved: 50,
      unit: 'bottles',
      location: 'Warehouse Bay A1',
      reorder_level: 50
    },
    {
      resource_id: 'f0000000-0000-0000-0000-000000000002',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      resource_name: 'Dry Ration Pack (Family)',
      category: 'Food & Nutrition',
      quantity_available: 120,
      quantity_reserved: 20,
      unit: 'packs',
      location: 'Warehouse Bay B3',
      reorder_level: 30
    }
  ], { onConflict: 'organization_id,resource_name,unit,location' });

  if (resErr) console.warn('Resource seed warning:', resErr.message);

  // 5. Seed Volunteers
  const { error: volErr } = await supabase.from('volunteers').upsert([
    {
      volunteer_id: '30000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      user_id: 'c0000000-0000-0000-0000-000000000003',
      availability_status: 'AVAILABLE',
      experience_years: 2.5,
      rating: 4.85,
      verification_status: 'VERIFIED'
    }
  ], { onConflict: 'organization_id,user_id' });

  if (volErr) console.warn('Volunteer seed warning:', volErr.message);

  // 6. Seed Requests
  const { error: reqErr } = await supabase.from('requests').upsert([
    {
      request_id: '20000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      requester_id: 'c0000000-0000-0000-0000-000000000002',
      title: 'Urgent drinking water for flood victims',
      description: '20 families stranded without potable water',
      category: 'Water & Sanitation',
      quantity_required: 40,
      unit: 'bottles',
      urgency: 'HIGH',
      status: 'VERIFIED',
      location: 'Kolonnawa Community Center',
      handover_pin: '4821'
    }
  ], { onConflict: 'request_id' });

  if (reqErr) console.warn('Request seed warning:', reqErr.message);

  // 7. Seed Tasks
  const { error: taskErr } = await supabase.from('tasks').upsert([
    {
      task_id: '40000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      request_id: '20000000-0000-0000-0000-000000000001',
      coordinator_id: 'c0000000-0000-0000-0000-000000000001',
      title: 'Deliver 40 bottles of drinking water',
      description: 'Relief dispatch mission',
      priority: 'HIGH',
      status: 'ASSIGNED',
      location: 'Kolonnawa'
    }
  ], { onConflict: 'task_id' });

  if (taskErr) console.warn('Task seed warning:', taskErr.message);

  // 8. Seed Task Assignments
  const { error: assignErr } = await supabase.from('task_assignments').upsert([
    {
      assignment_id: '50000000-0000-0000-0000-000000000001',
      task_id: '40000000-0000-0000-0000-000000000001',
      volunteer_id: '30000000-0000-0000-0000-000000000001',
      assigned_by: 'c0000000-0000-0000-0000-000000000001',
      assignment_status: 'ACCEPTED'
    }
  ], { onConflict: 'task_id,volunteer_id' });

  if (assignErr) console.warn('Assignment seed warning:', assignErr.message);

  console.log('✅ Baseline test fixtures populated successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}
