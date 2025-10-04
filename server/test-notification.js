// Test script to create a notification
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestNotification() {
  try {
    // First, get a user ID from the database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, company_id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('No users found:', userError);
      return;
    }

    const user = users[0];
    console.log('Creating test notification for user:', user.id);

    // Create a test notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        company_id: user.company_id,
        type: 'expense_submitted',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working!',
        data: { test: true }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      console.log('✅ Test notification created:', notification);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

createTestNotification();
