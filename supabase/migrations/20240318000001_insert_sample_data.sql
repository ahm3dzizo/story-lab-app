-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, create users in auth.users table
DO $$
DECLARE
    admin_id UUID := '11111111-1111-1111-1111-111111111111';
    partner1_id UUID := '22222222-2222-2222-2222-222222222222';
    partner2_id UUID := '33333333-3333-3333-3333-333333333333';
    manager1_id UUID := '44444444-4444-4444-4444-444444444444';
    employee1_id UUID := '55555555-5555-5555-5555-555555555555';
    employee2_id UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
    -- Insert auth users
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password)
    VALUES
        (admin_id, 'admin@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i'),
        (partner1_id, 'partner1@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i'),
        (partner2_id, 'partner2@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i'),
        (manager1_id, 'manager1@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i'),
        (employee1_id, 'employee1@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i'),
        (employee2_id, 'employee2@storylab.com', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '$2a$10$Qqg5dGhqEF9p0H5bMJSYlO6VlwOQSpPqzhOBYJ3d.a7MLBxLB4v6i');

    -- Insert public users with matching auth_ids
    INSERT INTO public.users (auth_id, email, username, role, avatar_url, status, theme_preference, language) VALUES
        (admin_id, 'admin@storylab.com', 'admin', 'admin', 'https://api.dicebear.com/7.x/avatars/svg?seed=admin', 'active', 'system', 'ar-SA'),
        (partner1_id, 'partner1@storylab.com', 'partner1', 'partner', 'https://api.dicebear.com/7.x/avatars/svg?seed=partner1', 'active', 'light', 'ar-SA'),
        (partner2_id, 'partner2@storylab.com', 'partner2', 'partner', 'https://api.dicebear.com/7.x/avatars/svg?seed=partner2', 'active', 'dark', 'ar-SA'),
        (manager1_id, 'manager1@storylab.com', 'manager1', 'manager', 'https://api.dicebear.com/7.x/avatars/svg?seed=manager1', 'active', 'system', 'ar-SA'),
        (employee1_id, 'employee1@storylab.com', 'employee1', 'employee', 'https://api.dicebear.com/7.x/avatars/svg?seed=employee1', 'active', 'light', 'ar-SA'),
        (employee2_id, 'employee2@storylab.com', 'employee2', 'employee', 'https://api.dicebear.com/7.x/avatars/svg?seed=employee2', 'active', 'dark', 'ar-SA');
END $$;

-- Insert sample partners
INSERT INTO public.partners (user_id, full_name, email, phone_number, profile_picture_url, specialization, company_name, business_type, tax_number, registration_number, address, city, country)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'أحمد محمد'
        ELSE 'سارة عبدالله'
    END,
    u.email,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN '+966501234567'
        ELSE '+966507654321'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'https://api.dicebear.com/7.x/avatars/svg?seed=ahmed'
        ELSE 'https://api.dicebear.com/7.x/avatars/svg?seed=sarah'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'Digital Marketing'
        ELSE 'Content Creation'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'Tech Solutions'
        ELSE 'Creative Hub'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'Technology'
        ELSE 'Media'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'TX123456789'
        ELSE 'TX987654321'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'RG987654321'
        ELSE 'RG123456789'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'شارع الملك فهد'
        ELSE 'شارع الأمير محمد بن سلمان'
    END,
    CASE 
        WHEN u.email = 'partner1@storylab.com' THEN 'الرياض'
        ELSE 'جدة'
    END,
    'المملكة العربية السعودية'
FROM public.users u
WHERE u.role = 'partner';

-- Insert sample employees
INSERT INTO public.employees (user_id, full_name, email, phone_number, department, position, employee_id, hire_date, reports_to, office_location, work_schedule, employment_type)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN 'خالد العمري'
        WHEN u.email = 'employee1@storylab.com' THEN 'نورة السعيد'
        ELSE 'فهد الشمري'
    END,
    u.email,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN '+966512345678'
        WHEN u.email = 'employee1@storylab.com' THEN '+966523456789'
        ELSE '+966534567890'
    END,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN 'Operations'
        WHEN u.email = 'employee1@storylab.com' THEN 'Marketing'
        ELSE 'Design'
    END,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN 'Operations Manager'
        WHEN u.email = 'employee1@storylab.com' THEN 'Content Specialist'
        ELSE 'UI/UX Designer'
    END,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN 'EMP001'
        WHEN u.email = 'employee1@storylab.com' THEN 'EMP002'
        ELSE 'EMP003'
    END,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN '2023-01-15'
        WHEN u.email = 'employee1@storylab.com' THEN '2023-03-01'
        ELSE '2023-04-15'
    END,
    CASE 
        WHEN u.email = 'manager1@storylab.com' THEN NULL
        ELSE (SELECT id FROM public.employees WHERE email = 'manager1@storylab.com')
    END,
    CASE 
        WHEN u.email = 'employee2@storylab.com' THEN 'فرع جدة'
        ELSE 'المكتب الرئيسي - الرياض'
    END,
    CASE 
        WHEN u.email = 'employee2@storylab.com' THEN '10:00 AM - 6:00 PM'
        ELSE '9:00 AM - 5:00 PM'
    END,
    'full-time'
FROM public.users u
WHERE u.role IN ('manager', 'employee');

-- Insert sample tasks
INSERT INTO public.tasks (title, description, status, priority, assigned_to, created_by, due_date, start_date, estimated_hours, tags, category, project)
SELECT 
    'تطوير واجهة المستخدم' as title,
    'تطوير واجهة مستخدم جديدة للتطبيق باستخدام React Native' as description,
    'pending' as status,
    'high' as priority,
    (SELECT id FROM public.users WHERE email = 'employee2@storylab.com') as assigned_to,
    (SELECT id FROM public.users WHERE email = 'manager1@storylab.com') as created_by,
    now() + interval '7 days' as due_date,
    now() as start_date,
    40 as estimated_hours,
    ARRAY['UI', 'React Native', 'Mobile'] as tags,
    'Development' as category,
    'Story Lab App' as project
UNION ALL
SELECT 
    'تصميم هوية بصرية',
    'تصميم هوية بصرية جديدة للشركة',
    'in_progress',
    'medium',
    (SELECT id FROM public.users WHERE email = 'employee2@storylab.com'),
    (SELECT id FROM public.users WHERE email = 'manager1@storylab.com'),
    now() + interval '14 days',
    now() - interval '2 days',
    20,
    ARRAY['Design', 'Branding'],
    'Design',
    'Brand Identity'
UNION ALL
SELECT 
    'حملة تسويقية',
    'إطلاق حملة تسويقية على وسائل التواصل الاجتماعي',
    'pending',
    'high',
    (SELECT id FROM public.users WHERE email = 'employee1@storylab.com'),
    (SELECT id FROM public.users WHERE email = 'partner1@storylab.com'),
    now() + interval '10 days',
    now() + interval '2 days',
    30,
    ARRAY['Marketing', 'Social Media'],
    'Marketing',
    'Q2 Campaign';

-- Insert sample task comments
INSERT INTO public.task_comments (task_id, user_id, content)
SELECT 
    t.id,
    u.id,
    'تم البدء في العمل على التصميم الأولي'
FROM public.tasks t
CROSS JOIN public.users u
WHERE t.title = 'تصميم هوية بصرية'
AND u.email = 'employee2@storylab.com';

-- Insert sample user stats
INSERT INTO public.user_stats (user_id, projects_count, completion_rate, team_members_count, total_tasks, completed_tasks)
SELECT 
    id,
    CASE 
        WHEN role = 'admin' THEN 15
        WHEN role = 'partner' AND email = 'partner1@storylab.com' THEN 8
        WHEN role = 'partner' AND email = 'partner2@storylab.com' THEN 6
        WHEN role = 'manager' THEN 12
        WHEN email = 'employee1@storylab.com' THEN 4
        ELSE 3
    END,
    CASE 
        WHEN role = 'admin' THEN 95.5
        WHEN role = 'partner' AND email = 'partner1@storylab.com' THEN 88.0
        WHEN role = 'partner' AND email = 'partner2@storylab.com' THEN 92.0
        WHEN role = 'manager' THEN 85.5
        WHEN email = 'employee1@storylab.com' THEN 78.0
        ELSE 82.5
    END,
    CASE 
        WHEN role = 'admin' THEN 8
        WHEN role = 'partner' AND email = 'partner1@storylab.com' THEN 3
        WHEN role = 'partner' AND email = 'partner2@storylab.com' THEN 2
        WHEN role = 'manager' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN role = 'admin' THEN 120
        WHEN role = 'partner' AND email = 'partner1@storylab.com' THEN 45
        WHEN role = 'partner' AND email = 'partner2@storylab.com' THEN 30
        WHEN role = 'manager' THEN 90
        WHEN email = 'employee1@storylab.com' THEN 25
        ELSE 20
    END,
    CASE 
        WHEN role = 'admin' THEN 115
        WHEN role = 'partner' AND email = 'partner1@storylab.com' THEN 40
        WHEN role = 'partner' AND email = 'partner2@storylab.com' THEN 28
        WHEN role = 'manager' THEN 77
        WHEN email = 'employee1@storylab.com' THEN 20
        ELSE 17
    END
FROM public.users;

-- Update sequences
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));
SELECT setval('public.partners_id_seq', (SELECT MAX(id) FROM public.partners));
SELECT setval('public.employees_id_seq', (SELECT MAX(id) FROM public.employees));
SELECT setval('public.tasks_id_seq', (SELECT MAX(id) FROM public.tasks));
SELECT setval('public.task_comments_id_seq', (SELECT MAX(id) FROM public.task_comments));
SELECT setval('public.user_stats_id_seq', (SELECT MAX(id) FROM public.user_stats)); 