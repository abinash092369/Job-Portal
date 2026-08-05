import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { UserModel } from './models/user.model';
import { CandidateProfileModel, EmployerProfileModel } from './models/profile.model';
import { JobModel } from './models/job.model';
import { ApplicationModel } from './models/application.model';
import { BookmarkModel } from './models/bookmark.model';
import { NotificationModel } from './models/notification.model';
import { RefreshTokenModel } from './models/refresh-token.model';

// Ensure env is loaded
dotenv.config();

const SEED_PASSWORD_PLAIN = 'Password123!';

const categories = [
  'Software Engineering',
  'Data Science',
  'Product Management',
  'Product Design',
  'Marketing',
  'Sales',
  'Human Resources',
];

const skillsPool = {
  'Software Engineering': ['TypeScript', 'JavaScript', 'Node.js', 'React', 'MongoDB', 'Express', 'Docker', 'AWS', 'Next.js', 'Go', 'Python'],
  'Data Science': ['Python', 'SQL', 'Pandas', 'TensorFlow', 'PyTorch', 'Machine Learning', 'R', 'Data Visualization', 'Tableau'],
  'Product Management': ['Product Strategy', 'Agile', 'Scrum', 'Jira', 'Roadmapping', 'User Research', 'A/B Testing', 'Analytics'],
  'Product Design': ['Figma', 'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems'],
  'Marketing': ['SEO', 'Content Strategy', 'Google Analytics', 'Social Media Marketing', 'Copywriting', 'Email Campaigns'],
  'Sales': ['Lead Generation', 'CRM', 'Negotiation', 'Enterprise Sales', 'Cold Calling', 'Account Management'],
  'Human Resources': ['Recruiting', 'Onboarding', 'Conflict Resolution', 'HRIS', 'Talent Management', 'Employee Engagement'],
};

const jobTitles = {
  'Software Engineering': ['Backend Engineer', 'Frontend Developer', 'Fullstack Engineer', 'DevOps Specialist', 'Software Engineer Intern', 'Tech Lead'],
  'Data Science': ['Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'BI Analyst', 'Analytics Engineer'],
  'Product Management': ['Associate Product Manager', 'Product Manager', 'Senior Product Manager', 'Technical Product Manager'],
  'Product Design': ['UX Researcher', 'UI/UX Designer', 'Product Designer', 'Senior UI Designer'],
  'Marketing': ['Marketing Coordinator', 'Growth Marketer', 'SEO Specialist', 'Social Media Manager'],
  'Sales': ['Sales Development Representative', 'Account Executive', 'Enterprise Account Executive', 'VP of Sales'],
  'Human Resources': ['HR Coordinator', 'Technical Recruiter', 'HR Generalist', 'Head of People'],
};

const locations = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote', 'London, UK', 'Berlin, Germany', 'Toronto, ON'];
const jobTypes = ['full-time', 'part-time', 'contract', 'remote'] as const;
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager'];
const companyNames = ['InnovateTech', 'CloudScale', 'DesignLab', 'FlowState Solutions', 'Apex Ventures', 'TalentGrid', 'DataPulse'];

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding script...');
    await connectDatabase();

    // 1. Clear Existing Collections
    console.log('🗑️ Clearing existing data from all collections...');
    await Promise.all([
      UserModel.deleteMany({}),
      CandidateProfileModel.deleteMany({}),
      EmployerProfileModel.deleteMany({}),
      JobModel.deleteMany({}),
      ApplicationModel.deleteMany({}),
      BookmarkModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      RefreshTokenModel.deleteMany({}),
    ]);
    console.log('✅ Cleaned database successfully.');

    // 2. Pre-generate password hash to avoid slow repeated hashing (takes 10+ seconds otherwise)
    console.log('🔑 Hashing seed user passwords...');
    const passwordHash = await bcrypt.hash(SEED_PASSWORD_PLAIN, 12);
    console.log('✅ Passwords hashed.');

    // 3. Create 2 Admin Users
    console.log('👤 Seeding Admin users...');
    const admins = await UserModel.insertMany([
      {
        email: 'admin1@jobportal.com',
        passwordHash,
        role: 'admin',
        isSuspended: false,
        deletedAt: null,
      },
      {
        email: 'admin2@jobportal.com',
        passwordHash,
        role: 'admin',
        isSuspended: false,
        deletedAt: null,
      },
    ]);
    console.log(`✅ Seeded ${admins.length} Admin accounts.`);

    // 4. Create 5 Employer Users and Profiles
    console.log('🏢 Seeding Employer accounts and company profiles...');
    const employers: mongoose.Document[] = [];
    for (let i = 1; i <= 5; i++) {
      const email = `employer${i}@company.com`;
      const employer = new UserModel({
        email,
        passwordHash,
        role: 'employer',
        isSuspended: false,
        deletedAt: null,
      });
      await employer.save();
      employers.push(employer);

      const companyName = companyNames[i - 1] || `Company ${i}`;
      const employerProfile = new EmployerProfileModel({
        userId: employer._id,
        companyName,
        logoUrl: `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, '')}.com` || '',
        description: `${companyName} is a fast-growing team focused on building next-generation products in the industry. We value collaboration, diversity, and rapid iteration.`,
        website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: i % 2 === 0 ? 'Technology' : 'Finance',
        companySize: i % 2 === 0 ? '11-50 employees' : '501-1000 employees',
      });
      await employerProfile.save();
    }
    console.log(`✅ Seeded ${employers.length} Employer accounts and profiles.`);

    // 5. Create 15 Candidate Users and Profiles
    console.log('👥 Seeding Candidate accounts and resumes...');
    const candidates: mongoose.Document[] = [];
    for (let i = 1; i <= 15; i++) {
      const email = `candidate${i}@gmail.com`;
      const candidate = new UserModel({
        email,
        passwordHash,
        role: 'candidate',
        isSuspended: false,
        deletedAt: null,
      });
      await candidate.save();
      candidates.push(candidate);

      const category = categories[i % categories.length];
      const categorySkills = skillsPool[category as keyof typeof skillsPool] || [];
      const skills = categorySkills.slice(0, 4);

      const name = `Candidate ${i}`;
      const candidateProfile = new CandidateProfileModel({
        userId: candidate._id,
        name,
        headline: `${category} Specialist`,
        skills,
        experience: [
          {
            company: 'Previous Corp',
            role: `Junior ${category}`,
            duration: '2 years',
            description: 'Worked on building robust features and collaborated with team members.',
          },
        ],
        education: [
          {
            school: 'State University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            year: 2024,
          },
        ],
        resumeUrl: `https://example.com/resumes/candidate-${i}.pdf`,
        profilePhotoUrl: `https://i.pravatar.cc/150?u=candidate${i}`,
        location: locations[i % locations.length],
        phone: `+1-555-010${i}`,
      });
      await candidateProfile.save();
    }
    console.log(`✅ Seeded ${candidates.length} Candidate accounts and profiles.`);

    // 6. Create 20 Sample Jobs
    console.log('💼 Seeding 20 jobs across employers...');
    const jobs: any[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const category = categories[i % categories.length];
      const titles = jobTitles[category as keyof typeof jobTitles] || ['Software Engineer'];
      const title = titles[i % titles.length] || 'Software Engineer';
      const employer = employers[i % employers.length];
      const skills = skillsPool[category as keyof typeof skillsPool] || [];
      
      const salaryMin = 40000 + (i * 5000);
      const salaryMax = salaryMin + 30000 + (i * 2000);
      const salaryRange = `$${(salaryMin / 1000).toFixed(0)}k - $${(salaryMax / 1000).toFixed(0)}k`;

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 15 + i);

      const jobStatus = i === 1 ? 'draft' : i === 2 ? 'closed' : 'active';

      const job = new JobModel({
        employerId: employer._id,
        title,
        description: `Are you a talented ${title} looking for your next challenge? We are hiring a key contributor in the ${category} space to design, implement, and deploy products serving millions of users globally.`,
        responsibilities: `- Collaborate with product designers and engineers.\n- Architect clean and scalable solutions.\n- Mentor junior members of the team.\n- Implement security and performance best practices.`,
        requirements: `- At least 3 years of hands-on experience.\n- Proficient in technologies like: ${skills.slice(0, 3).join(', ')}.\n- Strong communication and analytical skills.`,
        skills: skills.slice(0, 5),
        salaryRange,
        salaryMin,
        salaryMax,
        jobType: jobTypes[i % jobTypes.length],
        location: locations[i % locations.length],
        experienceLevel: experienceLevels[i % experienceLevels.length],
        applicationDeadline: deadline,
        status: jobStatus,
        views: Math.floor(Math.random() * 100),
        screeningQuestions: [
          'How many years of professional experience do you have in this role?',
          'What is your notice period / availability?',
        ],
      });

      await job.save();
      jobs.push(job);
    }
    console.log(`✅ Seeded ${jobs.length} jobs.`);

    // 7. Create a mix of Applications in different statuses
    console.log('📝 Seeding applications from candidates to jobs...');
    let applicationCount = 0;
    
    // Select active jobs
    const activeJobs = jobs.filter(j => j.status === 'active');
    
    const statuses = ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'] as const;

    for (let c = 0; c < candidates.length; c++) {
      const candidate = candidates[c];
      
      // Let each candidate apply to 2-3 jobs
      const jobsToApplyCount = 2 + (c % 2); 
      
      for (let j = 0; j < jobsToApplyCount; j++) {
        const jobIndex = (c + j * 5) % activeJobs.length;
        const job = activeJobs[jobIndex];
        
        // Skip if duplicate (which shouldn't happen with our index logic but to be safe)
        const duplicate = await ApplicationModel.findOne({ jobId: job._id, candidateId: candidate._id });
        if (duplicate) continue;

        const appStatus = statuses[(c + j) % statuses.length];
        
        // Generate historical timeline for status changes
        const statusHistory = [];
        const creationDate = new Date();
        creationDate.setDate(creationDate.getDate() - 10);
        
        statusHistory.push({ status: 'applied', changedAt: creationDate });
        
        if (appStatus !== 'applied') {
          const reviewDate = new Date(creationDate);
          reviewDate.setDate(reviewDate.getDate() + 2);
          statusHistory.push({ status: 'reviewed', changedAt: reviewDate });
          
          if (appStatus !== 'reviewed') {
            const nextDate = new Date(reviewDate);
            nextDate.setDate(nextDate.getDate() + 3);
            statusHistory.push({ status: appStatus, changedAt: nextDate });
          }
        }

        const application = new ApplicationModel({
          jobId: job._id,
          candidateId: candidate._id,
          resumeUrl: `https://example.com/resumes/candidate-${c + 1}.pdf`,
          coverLetter: `Hi, I am excited to apply for the ${job.title} position. I have strong skills matching your requirements and would love to join your team.`,
          screeningAnswers: [
            {
              question: 'How many years of professional experience do you have in this role?',
              answer: `${3 + (c % 5)} years`,
            },
            {
              question: 'What is your notice period / availability?',
              answer: c % 3 === 0 ? 'Immediate' : '30 days notice',
            },
          ],
          status: appStatus,
          notes: c % 3 === 0 ? ['Strong technical candidate', 'Schedule interview ASAP'] : [],
          statusHistory,
          createdAt: creationDate,
        });

        await application.save();
        applicationCount++;
      }
    }
    console.log(`✅ Seeded ${applicationCount} applications in various statuses.`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await disconnectDatabase();
  }
}

// Execute seeding script
runSeed();
