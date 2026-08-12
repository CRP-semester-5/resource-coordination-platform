import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
    // 1. Create User
    const { data: user, error: userErr } = await supabase.from('users').insert([{
        first_name: 'Test',
        last_name: 'User',
        email: 'test' + Date.now() + '@example.com'
    }]).select().single();
    if (userErr) throw userErr;

    // 2. Create Organization
    const { data: org, error: orgErr } = await supabase.from('organizations').insert([{
        organization_name: 'Test Org',
        email: 'org' + Date.now() + '@example.com',
        phone: '1234567890'
    }]).select().single();
    if (orgErr) throw orgErr;

    // 3. Generate JWT
    const token = jwt.sign(
        { sub: user.user_id, role: 'USER' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    console.log("=== SUCCESS ===");
    console.log("JWT_TOKEN=" + token);
    console.log("ORG_ID=" + org.organization_id);
    console.log("USER_ID=" + user.user_id);
}
run().catch(console.error);
