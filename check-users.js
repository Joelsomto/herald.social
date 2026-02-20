import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value;
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database...\n');
  console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...\n');

  // Check profiles
  console.log('1️⃣ Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    console.error('   Code:', profilesError.code);
    console.error('   Details:', profilesError.details);
  } else {
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('\n📋 Profiles:');
      profiles.forEach((p, i) => {
        console.log(`  ${i + 1}. Username: ${p.username || 'N/A'}`);
        console.log(`     Display Name: ${p.display_name || 'N/A'}`);
        console.log(`     User ID: ${p.user_id}`);
        console.log(`     Tier: ${p.tier || 'N/A'}`);
        console.log(`     Verified: ${p.is_verified ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No profiles found!');
    }
  }

  // Check wallets
  console.log('\n2️⃣ Checking wallets table...');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*')
    .limit(10);

  if (walletsError) {
    console.error('❌ Error fetching wallets:', walletsError.message);
  } else {
    console.log(`✅ Found ${wallets?.length || 0} wallets`);
    if (wallets && wallets.length > 0) {
      console.log('\n💰 Wallets:');
      wallets.forEach((w, i) => {
        console.log(`  ${i + 1}. User ID: ${w.user_id}`);
        console.log(`     HTTN Points: ${w.httn_points}`);
        console.log(`     HTTN Tokens: ${w.httn_tokens}`);
        console.log('');
      });
    }
  }

  // Check user_roles
  console.log('\n3️⃣ Checking user_roles table...');
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(10);

  if (rolesError) {
    console.error('❌ Error fetching roles:', rolesError.message);
  } else {
    console.log(`✅ Found ${roles?.length || 0} user roles`);
    if (roles && roles.length > 0) {
      roles.forEach((r, i) => {
        console.log(`  ${i + 1}. User: ${r.user_id} - Role: ${r.role}`);
      });
    }
  }

  // Check current session
  console.log('\n4️⃣ Checking current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Error getting session:', sessionError.message);
  } else if (session) {
    console.log('✅ Active session found:');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    
    // Check if this user has a profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError) {
      console.log(`   ⚠️  Error checking profile: ${profileError.message}`);
    } else if (userProfile) {
      console.log(`   ✅ Profile exists: ${userProfile.username || 'N/A'}`);
    } else {
      console.log('   ⚠️  No profile found for this user!');
      console.log('   💡 This might mean the trigger did not fire on signup.');
    }
  } else {
    console.log('⚠️  No active session. User needs to sign in.');
    console.log('   💡 Sign in to check if your profile was created.');
  }

  console.log('\n📊 Summary:');
  console.log(`   Profiles: ${profiles?.length || 0}`);
  console.log(`   Wallets: ${wallets?.length || 0}`);
  console.log(`   Roles: ${roles?.length || 0}`);
  console.log(`   Active Session: ${session ? 'Yes' : 'No'}`);
  
  if ((profiles?.length || 0) === 0) {
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if users have signed up via supabase.auth.signUp()');
    console.log('   2. Verify the trigger exists: SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';');
    console.log('   3. Check if migrations have been run');
    console.log('   4. Try signing up a new user to test the trigger');
  }
}

checkDatabase().catch(console.error);
