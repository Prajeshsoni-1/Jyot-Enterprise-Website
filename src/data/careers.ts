/** Careers content collection: open roles, internships and departments. */

export type JobType =
  | "Job"
  | "Internship"
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Remote";

export type EmploymentTypeCategory = "job" | "internship" | "needs_review";

export type PositionType = "job" | "internship";

export type Job = {
  id?: string | undefined;
  slug: string;
  title: string;
  department: "Financial" | "IT" | "Legal" | "Engineering" | "Cross-practice" | "Marketing" | string;
  type: JobType;
  positionType?: PositionType | undefined;
  employmentType?: EmploymentTypeCategory | undefined;
  category?: string | undefined;
  location: string;
  workMode?: "On-site" | "Hybrid" | "Remote" | string | undefined;
  experience: string;
  education?: string | undefined;
  duration?: string | undefined;
  salary: string;
  showSalary?: boolean | undefined;
  openings?: number | undefined;
  deadline?: string | undefined;
  applicationInstructions?: string | undefined;
  logo?: string | undefined;
  summary: string;
  body?: string | undefined;
  responsibilities: string[];
  requirements: string[];
  qualifications?: string[] | undefined;
  skills?: string[] | undefined;
  preferredSkills?: string[] | undefined;
  niceToHave?: string[] | undefined;
  benefits?: string[] | undefined;
  learningOpportunities?: string[] | undefined;
  workingHours?: string | undefined;
  reportingTo?: string | undefined;
  featured?: boolean | undefined;
  published?: boolean | undefined;
  status?: "draft" | "published" | "archived" | "closed" | undefined;
  sortOrder?: number | undefined;
  posted: string;
  publishedAt?: string | undefined;
  updatedAt?: string | undefined;
  heroImage?: string | undefined;
  // SEO
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
  seoKeywords?: string[] | undefined;
  canonicalUrl?: string | undefined;
  ogImage?: string | undefined;
  noindex?: boolean | undefined;
  nofollow?: boolean | undefined;
  // Page / Section controls
  controls?: {
    showBenefits?: boolean | undefined;
    showSkills?: boolean | undefined;
    showApplyForm?: boolean | undefined;
    showDeadline?: boolean | undefined;
  } | undefined;
};

export const DEPARTMENTS = [
  {
    name: "Financial",
    body: "Credit analysis, project finance, lender relationships and client advisory.",
  },
  { name: "IT", body: "Product engineering, ERP and CRM delivery, AI automation and cloud." },
  { name: "Legal", body: "Compliance desks, ROC and GST filings, IP and contract drafting." },
  {
    name: "Engineering",
    body: "Mechanical design, CAD, simulation, plant layout and site supervision.",
  },
] as const;

export const JOBS: Job[] = [
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    department: "IT",
    type: "Internship",
    employmentType: "internship",
    location: "Gandhinagar, Gujarat",
    experience: "Fresher / experienced can apply",
    salary: "Performance-based",
    summary:
      "Jyot Enterprise is looking for a passionate AI Engineer to join our technology and automation team. Freshers and experienced candidates are welcome to apply. The role involves developing AI-powered solutions, automation systems, intelligent applications and integrating modern AI technologies into real-world business solutions.",
    responsibilities: [
      "Develop and integrate AI-powered applications and business solutions.",
      "Work with Generative AI and Large Language Models.",
      "Build AI automation workflows for business processes.",
      "Integrate AI APIs and third-party services.",
      "Develop and maintain Python-based applications and services.",
      "Perform data processing and API integration.",
      "Research and evaluate new AI tools, models and technologies.",
      "Create prompts and improve AI outputs for business use cases.",
      "Test, debug and optimize AI-powered solutions.",
      "Work with databases and backend services when required.",
      "Collaborate with developers, business teams and clients.",
      "Document AI workflows, implementations and technical processes.",
    ],
    requirements: [
      "Bachelor's or Master's degree in Computer Science, IT, AI, Data Science or a related field is preferred.",
      "Strong interest in Artificial Intelligence and emerging technologies.",
      "Basic to good knowledge of Python.",
      "Understanding of APIs and software development concepts.",
      "Basic understanding of databases and SQL.",
      "Good analytical and problem-solving skills.",
      "Ability to learn new AI technologies quickly.",
      "Good communication and teamwork skills.",
      "Freshers are welcome to apply.",
      "Candidates with relevant professional experience are also welcome.",
    ],
    niceToHave: [
      "Experience with OpenAI or other LLM APIs.",
      "Experience with LangChain or similar AI frameworks.",
      "Knowledge of Machine Learning.",
      "Experience with FastAPI or Flask.",
      "Knowledge of React or JavaScript.",
      "Experience with automation platforms.",
      "Knowledge of vector databases and RAG systems.",
      "Experience building AI chatbots or AI agents.",
      "Previous AI/ML projects, internships or portfolio projects.",
    ],
    posted: "2026-09-08",
  },
  {
    slug: "digital-marketing-executive",
    title: "Digital Marketing Executive",
    department: "Marketing",
    type: "Internship",
    employmentType: "internship",
    location: "Gandhinagar, Gujarat",
    experience: "Fresher and experienced can apply",
    salary: "Performance-based",
    summary:
      "Jyot Enterprise is looking for a creative and result-oriented Digital Marketing Executive to join our marketing team. Freshers and experienced candidates are welcome to apply. The role involves managing digital marketing campaigns, social media, SEO, content, lead generation and online brand growth.",
    responsibilities: [
      "Plan and execute digital marketing campaigns.",
      "Manage and grow social media platforms.",
      "Create and publish engaging social media content.",
      "Support SEO activities and improve website visibility.",
      "Conduct keyword and competitor research.",
      "Plan and manage Google Ads and Meta Ads campaigns.",
      "Generate and optimize online leads.",
      "Monitor campaign performance and prepare reports.",
      "Track website and social media analytics.",
      "Develop content ideas for posts, blogs, reels and advertisements.",
      "Coordinate with designers and content creators.",
      "Maintain consistent brand communication across digital platforms.",
      "Research new digital marketing trends and opportunities.",
      "Continuously optimize campaigns based on performance data.",
    ],
    requirements: [
      "Bachelor's degree in Marketing, Business, Commerce, Mass Communication or a related field is preferred.",
      "Strong interest in digital marketing and online business growth.",
      "Basic understanding of SEO and social media marketing.",
      "Good communication and writing skills.",
      "Creative thinking and problem-solving ability.",
      "Basic knowledge of digital marketing tools.",
      "Ability to analyze campaign performance.",
      "Willingness to learn and experiment with new strategies.",
      "Freshers are welcome to apply.",
      "Candidates with relevant professional experience are also welcome.",
    ],
    niceToHave: [
      "Experience with Google Ads.",
      "Experience with Meta Ads Manager.",
      "Knowledge of Google Analytics and Search Console.",
      "SEO tools experience.",
      "Canva or basic graphic design knowledge.",
      "Experience managing Instagram, Facebook and LinkedIn.",
      "Basic video/reel content knowledge.",
      "Experience with WordPress or other CMS platforms.",
      "Previous digital marketing internship or portfolio.",
      "Understanding of lead generation and conversion optimization.",
    ],
    posted: "2026-09-08",
  },
];

export const CAREER_BENEFITS = [
  { title: "Ownership from day one", body: "You lead client conversations, not just tickets." },
  {
    title: "Four practices, one roof",
    body: "Rare exposure across finance, software, law and hardware.",
  },
  { title: "Learning budget", body: "Certifications and tooling funded, no approval theatre." },
  {
    title: "Honest hours",
    body: "Sustainable delivery cadence — we plan instead of firefighting.",
  },
];
