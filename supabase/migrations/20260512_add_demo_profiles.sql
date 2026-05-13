-- Demo profiles for testing
-- Note: These require corresponding auth users to be created first

-- Insert demo users with raw SQL (bypassing auth normally requires direct DB access)
-- For now, we'll create profiles assuming demo user IDs exist
-- In production, use the Auth API to create these users first

-- Demo Profile 1 - React Expert
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Sarah Chen',
  'React & TypeScript enthusiast. Love building scalable web apps. Also into design systems and open source.',
  'both'::public.user_intent,
  ARRAY['React', 'TypeScript', 'Node.js', 'GraphQL'],
  ARRAY['Web Dev', 'Open Source', 'UI/UX', 'Mentoring'],
  'sarahchen',
  'San Francisco, CA',
  'America/Los_Angeles',
  5,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Demo Profile 2 - Full Stack Developer
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Alex Rodriguez',
  'Full-stack dev with Python & Vue.js. Passionate about DevOps and cloud infrastructure.',
  'collab'::public.user_intent,
  ARRAY['Python', 'Vue.js', 'PostgreSQL', 'Docker', 'AWS'],
  ARRAY['Backend', 'DevOps', 'Cloud', 'Automation'],
  'alexrod',
  'Austin, TX',
  'America/Chicago',
  6,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Demo Profile 3 - Mobile Developer
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'Emma Thompson',
  'iOS & React Native developer. Building beautiful mobile experiences. Tennis & coffee lover ☕️',
  'date'::public.user_intent,
  ARRAY['Swift', 'React Native', 'Objective-C', 'Firebase'],
  ARRAY['Mobile Dev', 'UI Design', 'Startups', 'Gaming'],
  'emmathompson',
  'New York, NY',
  'America/New_York',
  4,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Demo Profile 4 - Data Scientist
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000004'::uuid,
  'James Park',
  'ML engineer & data scientist. Working with Python, TensorFlow, and big data. Let''s build something cool!',
  'both'::public.user_intent,
  ARRAY['Python', 'TensorFlow', 'SQL', 'Apache Spark', 'Jupyter'],
  ARRAY['Machine Learning', 'Data Analysis', 'Research', 'Basketball'],
  'jamespark',
  'Seattle, WA',
  'America/Los_Angeles',
  7,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Demo Profile 5 - DevOps Engineer
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000005'::uuid,
  'Lisa Wang',
  'DevOps & Infrastructure as Code expert. Kubernetes, Terraform, CI/CD pipelines. Let''s automate everything!',
  'collab'::public.user_intent,
  ARRAY['Kubernetes', 'Terraform', 'Go', 'Docker', 'CI/CD'],
  ARRAY['DevOps', 'Infrastructure', 'Cloud Native', 'Hiking'],
  'lisawang',
  'Portland, OR',
  'America/Los_Angeles',
  8,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Demo Profile 6 - Frontend Designer
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  intent,
  tech_stack,
  interests,
  github_handle,
  location,
  timezone,
  years_experience,
  avatar_url,
  onboarded,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000006'::uuid,
  'Jordan Lee',
  'Frontend architect with focus on accessibility & performance. CSS nerd 🤓 Always learning.',
  'date'::public.user_intent,
  ARRAY['React', 'Next.js', 'Tailwind CSS', 'Accessibility', 'Performance'],
  ARRAY['Frontend', 'Design Systems', 'Accessibility', 'Music'],
  'jordanlee',
  'Los Angeles, CA',
  'America/Los_Angeles',
  5,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;
