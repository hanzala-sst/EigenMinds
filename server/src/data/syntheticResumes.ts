import { SyntheticResume } from '../types/resume';

export const syntheticResumesSeed: SyntheticResume[] = [
  {
    candidateId: 'CAND-001',
    name: 'Alex Mercer (Strong Match)',
    skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'TypeScript', 'Docker'],
    experienceYears: 4,
    summary: 'Senior Backend Developer with 4 years building scalable REST APIs and microservices using Node.js, Express, and MongoDB.',
    projects: [
      {
        name: 'Payment Processing Service',
        description: 'Built high-throughput payment processing API',
        technologies: ['Node.js', 'Express', 'MongoDB']
      }
    ],
    education: 'B.S. Computer Science'
  },
  {
    candidateId: 'CAND-002',
    name: 'Blake Taylor (Partial Match)',
    skills: ['Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'Redis'],
    experienceYears: 3,
    summary: 'Backend Engineer with 3 years of Node.js experience, skilled in SQL databases and caching, looking to expand NoSQL skills.',
    projects: [
      {
        name: 'User Management API',
        description: 'RESTful API for authentication and session store',
        technologies: ['Node.js', 'Express', 'PostgreSQL']
      }
    ],
    education: 'B.S. Software Engineering'
  },
  {
    candidateId: 'CAND-003',
    name: 'Charlie Vance (Missing Required Skill)',
    skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'REST APIs', 'AWS'],
    experienceYears: 5,
    summary: 'Python Backend Engineer with 5 years experience creating robust cloud APIs. No Node.js or MongoDB experience.',
    projects: [
      {
        name: 'Analytics Pipeline',
        description: 'Data ingestion platform with Django',
        technologies: ['Python', 'Django', 'PostgreSQL']
      }
    ],
    education: 'M.S. Computer Science'
  },
  {
    candidateId: 'CAND-004',
    name: 'Dylan Reed (Insufficient Experience)',
    skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
    experienceYears: 0.5,
    summary: 'Junior Node.js developer who completed bootcamp 6 months ago. Skilled in MERN stack concepts.',
    projects: [
      {
        name: 'Todo App Backend',
        description: 'MERN stack portfolio project',
        technologies: ['Node.js', 'Express', 'MongoDB']
      }
    ],
    education: 'Coding Bootcamp Certificate'
  },
  {
    candidateId: 'CAND-005',
    name: 'Elliot Sky (Unrelated Candidate)',
    skills: ['UI/UX Design', 'Figma', 'HTML5', 'CSS3', 'React'],
    experienceYears: 3,
    summary: 'Product Designer and Frontend UI Specialist with 3 years experience creating Figma wireframes and React interfaces.',
    projects: [
      {
        name: 'E-commerce Design System',
        description: 'Component design library in Figma',
        technologies: ['Figma', 'React', 'CSS3']
      }
    ],
    education: 'B.A. Graphic Design'
  }
];
