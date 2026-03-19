const { Role, User, Lead, LeadActivity } = require('../models');

const seedDatabase = async () => {
  try {
    // Check if already seeded
    const roleCount = await Role.count();
    if (roleCount > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    console.log('🌱 Seeding database...');

    // Create Roles
    const adminRole = await Role.create({
      name: 'admin',
      name_ar: 'مدير عام',
      level: 3,
      permissions: { all: true },
      description: 'General Manager - Full access',
    });

    const managerRole = await Role.create({
      name: 'manager',
      name_ar: 'مدير مباشر',
      level: 2,
      permissions: { leads: ['read', 'update'], meetings: ['create', 'update', 'delete'], users: ['read'] },
      description: 'Direct Manager - Level 2',
    });

    const salesRole = await Role.create({
      name: 'sales',
      name_ar: 'مندوب مبيعات',
      level: 1,
      permissions: { leads: ['create', 'read', 'update'] },
      description: 'Sales / Call Center - Level 1',
    });

    // Create Admin User
    const admin = await User.create({
      name: 'مدير النظام',
      email: 'admin@alteam.com',
      password: 'Admin@123',
      phone: '0501234567',
      role_id: adminRole.id,
      is_active: true,
    });

    // Create Manager
    const manager = await User.create({
      name: 'أحمد المدير',
      email: 'manager@alteam.com',
      password: 'Manager@123',
      phone: '0507654321',
      role_id: managerRole.id,
      manager_id: admin.id,
      is_active: true,
    });

    // Create Sales Users
    const sales1 = await User.create({
      name: 'محمد المبيعات',
      email: 'sales1@alteam.com',
      password: 'Sales@123',
      phone: '0551234567',
      role_id: salesRole.id,
      manager_id: manager.id,
      is_active: true,
    });

    const sales2 = await User.create({
      name: 'سارة الاتصالات',
      email: 'sales2@alteam.com',
      password: 'Sales@123',
      phone: '0559876543',
      role_id: salesRole.id,
      manager_id: manager.id,
      is_active: true,
    });

    // Create Sample Leads
    const lead1 = await Lead.create({
      phone: '0561111111',
      name: 'خالد الأحمد',
      company_name: 'شركة الأحمد للتجارة',
      email: 'khalid@company.com',
      status: 'interested',
      current_level: 1,
      first_contact_date: new Date(),
      follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'مهتم بالخدمة - يطلب عرض سعر',
      source: 'referral',
      priority: 'high',
      assigned_to: sales1.id,
      created_by: sales1.id,
    });

    await LeadActivity.create({
      lead_id: lead1.id,
      user_id: sales1.id,
      type: 'call',
      description: 'تم الاتصال بالعميل - أبدى اهتماماً بالخدمة',
      call_result: 'answered',
      call_duration: 180,
    });

    await Lead.create({
      phone: '0562222222',
      name: 'فاطمة العلي',
      company_name: 'مؤسسة العلي',
      status: 'new',
      current_level: 1,
      first_contact_date: new Date(),
      priority: 'medium',
      assigned_to: sales2.id,
      created_by: sales2.id,
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('📋 Default Accounts:');
    console.log('   👑 Admin:   admin@alteam.com   / Admin@123');
    console.log('   👔 Manager: manager@alteam.com / Manager@123');
    console.log('   💼 Sales 1: sales1@alteam.com  / Sales@123');
    console.log('   💼 Sales 2: sales2@alteam.com  / Sales@123\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
};

module.exports = { seedDatabase };

