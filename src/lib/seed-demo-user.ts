import { supabase } from './supabase';

export const seedDemoUser = async () => {
  try {
    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@fruitshop.com')
      .single();

    if (existingUser) {
      console.log('Demo user already exists');
      return;
    }

    // Create demo user in the users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: '1', // Using a fixed ID for demo purposes
        email: 'demo@fruitshop.com',
        full_name: 'Demo Admin User',
        role_id: 'admin',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating demo user:', error);
      return;
    }

    console.log('Demo user created successfully:', data);
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
};

// Function to create additional demo users for testing
export const seedDemoUsers = async () => {
  try {
    const demoUsers = [
      {
        id: '2',
        email: 'manager@fruitshop.com',
        full_name: 'Demo Manager',
        role_id: 'manager',
        status: 'active'
      },
      {
        id: '3',
        email: 'staff@fruitshop.com',
        full_name: 'Demo Staff',
        role_id: 'staff',
        status: 'active'
      },
      {
        id: '4',
        email: 'viewer@fruitshop.com',
        full_name: 'Demo Viewer',
        role_id: 'viewer',
        status: 'active'
      },
      {
        id: '5',
        email: 'inactive@fruitshop.com',
        full_name: 'Inactive User',
        role_id: 'viewer',
        status: 'inactive'
      }
    ];

    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!existingUser) {
        const { error } = await supabase
          .from('users')
          .insert(user);

        if (error) {
          console.error(`Error creating user ${user.email}:`, error);
        } else {
          console.log(`Created demo user: ${user.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding demo users:', error);
  }
};
