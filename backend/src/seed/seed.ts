import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User } from '../models/User';
import { EmployerProfile } from '../models/EmployerProfile';
import { CandidateProfile } from '../models/CandidateProfile';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { Bookmark } from '../models/Bookmark';
import { Notification } from '../models/Notification';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      EmployerProfile.deleteMany({}),
      CandidateProfile.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Bookmark.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    const commonPasswordHash = await bcrypt.hash('password123', 12);

    // 1. Create Admins
    console.log('Seeding Admin accounts...');
    const admin1 = await User.create({
      email: 'admin1@jobportal.com',
      passwordHash: commonPasswordHash,
      role: 'admin',
      isVerified: true,
      isSuspended: false,
    });
    const admin2 = await User.create({
      email: 'admin2@jobportal.com',
      passwordHash: commonPasswordHash,
      role: 'admin',
      isVerified: true,
      isSuspended: false,
    });

    // 2. Create Employers & Profiles
    console.log('Seeding Employer accounts...');
    const employerData = [
      {
        email: 'techcorp@jobportal.com',
        companyName: 'TechCorp Solutions',
        logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150',
        industry: 'Software & Technology',
        website: 'https://techcorp.example.com',
        description: 'Leading provider of enterprise cloud applications.',
        companySize: '500-1000 employees',
        isVerified: true,
      },
      {
        email: 'acme@jobportal.com',
        companyName: 'Acme Systems',
        logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150',
        industry: 'Fintech & Banking',
        website: 'https://acme.example.com',
        description: 'Innovative digital banking and payment platforms.',
        companySize: '100-500 employees',
        isVerified: true,
      },
      {
        email: 'innovatex@jobportal.com',
        companyName: 'InnovateX Labs',
        logoUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150',
        industry: 'Artificial Intelligence',
        website: 'https://innovatex.example.com',
        description: 'Pioneering machine learning and neural networks.',
        companySize: '50-100 employees',
        isVerified: false,
      },
      {
        email: 'cloudscale@jobportal.com',
        companyName: 'CloudScale Infrastructure',
        logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
        industry: 'Cloud & Infrastructure',
        website: 'https://cloudscale.example.com',
        description: 'Scalable Kubernetes and DevOps automation solutions.',
        companySize: '200-500 employees',
        isVerified: true,
      },
      {
        email: 'designlabs@jobportal.com',
        companyName: 'DesignLabs Creative',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
        industry: 'Design & Media',
        website: 'https://designlabs.example.com',
        description: 'Award-winning UX agency creating digital experiences.',
        companySize: '20-50 employees',
        isVerified: false,
      },
    ];

    const employers = [];
    for (const emp of employerData) {
      const user = await User.create({
        email: emp.email,
        passwordHash: commonPasswordHash,
        role: 'employer',
        isVerified: true,
        isSuspended: false,
      });

      const profile = await EmployerProfile.create({
        userId: user._id,
        companyName: emp.companyName,
        logoUrl: emp.logoUrl,
        description: emp.description,
        website: emp.website,
        industry: emp.industry,
        companySize: emp.companySize,
        isVerified: emp.isVerified,
      });

      employers.push({ user, profile });
    }

    // 3. Create Candidates & Profiles
    console.log('Seeding Candidate accounts...');
    const candidates = [];
    const candidateSkillsSet = [
      ['React', 'TypeScript', 'Node.js', 'TailwindCSS'],
      ['Python', 'Django', 'PostgreSQL', 'Docker'],
      ['Java', 'Spring Boot', 'Microservices', 'AWS'],
      ['Figma', 'UI/UX Design', 'Wireframing', 'User Research'],
      ['Node.js', 'Express', 'MongoDB', 'GraphQL'],
      ['Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      ['Data Science', 'Python', 'Pandas', 'Scikit-learn'],
      ['Vue.js', 'JavaScript', 'CSS3', 'HTML5'],
      ['Product Management', 'Agile', 'Scrum', 'Jira'],
      ['React Native', 'iOS', 'Android', 'Flutter'],
    ];

    for (let i = 1; i <= 15; i++) {
      const user = await User.create({
        email: `candidate${i}@jobportal.com`,
        passwordHash: commonPasswordHash,
        role: 'candidate',
        isVerified: i % 5 !== 0, // Most verified, some unverified
        isSuspended: false,
      });

      const skills = candidateSkillsSet[(i - 1) % candidateSkillsSet.length];
      const profile = await CandidateProfile.create({
        userId: user._id,
        name: `Candidate User ${i}`,
        headline: `Experienced ${skills[0]} Developer`,
        skills,
        location: i % 2 === 0 ? 'San Francisco, CA' : 'New York, NY',
        phone: `+1-555-010${i < 10 ? '0' + i : i}`,
        resumeUrl: `${config.backendPublicUrl}/uploads/resume-sample-${i}.pdf`,
        profilePhotoUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        experience: [
          {
            company: 'Previous Corp',
            role: 'Software Engineer',
            duration: '2021 - Present',
            description: 'Developed scalable web applications.',
          },
        ],
        education: [
          {
            school: 'State University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            year: 2020,
          },
        ],
      });

      candidates.push({ user, profile });
    }

    // 4. Create Jobs across employers
    console.log('Seeding Job listings...');
    const jobTemplates = [
      {
        title: 'Senior Frontend Engineer (React/TS)',
        description: 'Join our core frontend team to build high-performance web applications with React and TypeScript.',
        responsibilities: 'Build responsive components, write unit tests, collaborate with design team.',
        requirements: '4+ years of React experience, expert TypeScript skills.',
        skills: ['React', 'TypeScript', 'TailwindCSS', 'Vite'],
        salaryRange: '$130k - $160k',
        jobType: 'full-time',
        location: 'San Francisco, CA',
        experienceLevel: 'Senior',
        status: 'active',
      },
      {
        title: 'Full Stack Node.js Developer',
        description: 'We are looking for a skilled Full Stack Engineer to lead backend architecture and API integrations.',
        responsibilities: 'Design RESTful APIs, manage MongoDB collections, implement JWT auth.',
        requirements: '3+ years Node.js & Express, strong database indexing knowledge.',
        skills: ['Node.js', 'Express', 'MongoDB', 'TypeScript'],
        salaryRange: '$110k - $140k',
        jobType: 'full-time',
        location: 'New York, NY',
        experienceLevel: 'Mid Level',
        status: 'active',
      },
      {
        title: 'DevOps & Cloud Engineer',
        description: 'Help build and maintain containerized infrastructure across AWS and Kubernetes.',
        responsibilities: 'Maintain CI/CD pipelines, optimize cluster resources, ensure uptime.',
        requirements: 'Experience with Docker, Kubernetes, Terraform, and AWS Services.',
        skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
        salaryRange: '$140k - $175k',
        jobType: 'remote',
        location: 'Remote',
        experienceLevel: 'Senior',
        status: 'active',
      },
      {
        title: 'UI/UX Product Designer',
        description: 'Lead design initiatives across web and mobile platforms.',
        responsibilities: 'Create Figma design systems, conduct user testing sessions.',
        requirements: 'Portfolio demonstrating end-to-end design process.',
        skills: ['Figma', 'UI/UX Design', 'Prototyping'],
        salaryRange: '$95k - $120k',
        jobType: 'full-time',
        location: 'Austin, TX',
        experienceLevel: 'Mid Level',
        status: 'active',
      },
      {
        title: 'Backend Python Engineer',
        description: 'Build robust data processing pipelines and Django backend services.',
        responsibilities: 'Optimize PostgreSQL queries, write clean Python code.',
        requirements: 'Strong proficiency in Python, Django, and SQL.',
        skills: ['Python', 'Django', 'PostgreSQL'],
        salaryRange: '$100k - $130k',
        jobType: 'contract',
        location: 'Chicago, IL',
        experienceLevel: 'Mid Level',
        status: 'draft', // Draft job for admin review
      },
      {
        title: 'Machine Learning Specialist',
        description: 'Develop predictive models and natural language processing solutions.',
        responsibilities: 'Train transformer models, deploy model endpoints.',
        requirements: 'M.S. in CS or equivalent, PyTorch/TensorFlow experience.',
        skills: ['Python', 'PyTorch', 'Machine Learning', 'NLP'],
        salaryRange: '$150k - $190k',
        jobType: 'remote',
        location: 'Remote',
        experienceLevel: 'Senior',
        status: 'active',
      },
      {
        title: 'Junior QA Test Engineer',
        description: 'Perform automated and manual testing on web applications.',
        responsibilities: 'Write Cypress end-to-end tests, report bugs.',
        requirements: '1+ year experience in software QA testing.',
        skills: ['Cypress', 'JavaScript', 'QA Testing'],
        salaryRange: '$70k - $85k',
        jobType: 'part-time',
        location: 'Seattle, WA',
        experienceLevel: 'Entry Level',
        status: 'closed', // Closed job
      },
    ];

    const jobs = [];
    let jobCounter = 0;

    for (const emp of employers) {
      for (const tpl of jobTemplates) {
        jobCounter++;
        const job = await Job.create({
          employerId: emp.user._id,
          title: `${tpl.title} (${jobCounter})`,
          description: tpl.description,
          responsibilities: tpl.responsibilities,
          requirements: tpl.requirements,
          skills: tpl.skills,
          salaryRange: tpl.salaryRange,
          jobType: tpl.jobType as any,
          location: tpl.location,
          experienceLevel: tpl.experienceLevel,
          applicationDeadline: '2026-12-31',
          status: (jobCounter % 6 === 0 ? 'draft' : jobCounter % 7 === 0 ? 'closed' : 'active') as any,
          views: Math.floor(Math.random() * 150) + 10,
          screeningQuestions: ['Do you have work authorization?', 'What is your notice period?'],
        });
        jobs.push(job);
      }
    }

    // 5. Create Applications & Bookmarks
    console.log('Seeding Applications & Saved Jobs...');
    const statuses: ('applied' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired')[] = [
      'applied',
      'reviewed',
      'shortlisted',
      'interview',
      'rejected',
      'hired',
    ];

    const activeJobs = jobs.filter((j) => j.status === 'active');

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      // Apply to 2 active jobs
      const job1 = activeJobs[i % activeJobs.length];
      const job2 = activeJobs[(i + 3) % activeJobs.length];

      const status1 = statuses[i % statuses.length];
      const status2 = statuses[(i + 2) % statuses.length];

      // Application 1
      await Application.create({
        jobId: job1._id,
        candidateId: candidate.user._id,
        coverLetter: `Hello, I am very interested in the ${job1.title} position.`,
        resumeUrl: candidate.profile.resumeUrl || `${config.backendPublicUrl}/uploads/resume.pdf`,
        screeningAnswers: [
          { question: 'Do you have work authorization?', answer: 'Yes' },
          { question: 'What is your notice period?', answer: '2 weeks' },
        ],
        status: status1,
        notes: ['Candidate has good communications skills.', 'Follow up next week.'],
        statusHistory: [
          { status: 'applied', changedAt: new Date(Date.now() - 86400000 * 3) },
          { status: status1, changedAt: new Date(), changedBy: job1.employerId },
        ],
      });

      // Application 2
      await Application.create({
        jobId: job2._id,
        candidateId: candidate.user._id,
        coverLetter: `Hi there, please accept my application for ${job2.title}.`,
        resumeUrl: candidate.profile.resumeUrl || `${config.backendPublicUrl}/uploads/resume.pdf`,
        status: status2,
        notes: [],
        statusHistory: [
          { status: 'applied', changedAt: new Date(Date.now() - 86400000 * 2) },
          { status: status2, changedAt: new Date(), changedBy: job2.employerId },
        ],
      });

      // Bookmark a job
      const savedJob = activeJobs[(i + 5) % activeJobs.length];
      await Bookmark.create({
        candidateId: candidate.user._id,
        jobId: savedJob._id,
      });

      // Create a Notification
      await Notification.create({
        userId: candidate.user._id,
        type: 'status_changed',
        title: 'Application Status Updated',
        message: `Your application for "${job1.title}" has been updated to "${status1}".`,
        isRead: i % 2 === 0,
      });
    }

    console.log('\n================ SEED COMPLETE ================');
    console.log(`Admins Created:     2 (admin1@jobportal.com / password123)`);
    console.log(`Employers Created:  ${employers.length} (e.g. techcorp@jobportal.com / password123)`);
    console.log(`Candidates Created: ${candidates.length} (e.g. candidate1@jobportal.com / password123)`);
    console.log(`Jobs Created:       ${jobs.length} (${jobs.filter((j) => j.status === 'active').length} active)`);
    console.log(`Applications:       ${candidates.length * 2}`);
    console.log('===============================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
