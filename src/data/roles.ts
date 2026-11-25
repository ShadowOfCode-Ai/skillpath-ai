/**
 * @file roles.ts
 * Career roles definitions with core and supporting skill requirements and justifications.
 */

import { SkillImportance } from '../config/scoring';

export interface RequiredSkill {
  skillId: string;
  importance: SkillImportance;
  whyItMatters: string;
}

export interface CareerRole {
  id: string;
  name: string;
  summary: string;
  requiredSkills: RequiredSkill[];
}

export const CAREER_ROLES: CareerRole[] = [
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    summary: 'Transforms raw operational and product data into actionable insights, executive dashboards, and statistical reports.',
    requiredSkills: [
      { skillId: 'sql', importance: 'core', whyItMatters: 'Essential for querying relational databases, aggregations, and cohort segmentation.' },
      { skillId: 'excel', importance: 'core', whyItMatters: 'Widely used for ad-hoc modeling, quick stakeholder analysis, and financial reporting.' },
      { skillId: 'statistics', importance: 'core', whyItMatters: 'Crucial for interpreting variance, correlation, and hypothesis testing on user behavior.' },
      { skillId: 'data_visualization', importance: 'core', whyItMatters: 'Enables clear communication of findings to technical and non-technical decision-makers.' },
      { skillId: 'python', importance: 'supporting', whyItMatters: 'Automates complex ETL workflows and builds reusable statistical scripts.' },
      { skillId: 'pandas', importance: 'supporting', whyItMatters: 'Powers high-performance tabular data manipulation and cleaning.' },
      { skillId: 'power_bi', importance: 'supporting', whyItMatters: 'Builds enterprise-grade interactive dashboards and self-service analytics.' },
    ],
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    summary: 'Develops predictive statistical models, machine learning algorithms, and experimental frameworks to solve complex business problems.',
    requiredSkills: [
      { skillId: 'python', importance: 'core', whyItMatters: 'The primary language for scientific computing, feature modeling, and experimentation.' },
      { skillId: 'statistics', importance: 'core', whyItMatters: 'Underpins rigorous A/B testing, statistical modeling, and inference.' },
      { skillId: 'machine_learning', importance: 'core', whyItMatters: 'Powers predictive algorithms, regression analysis, and classification systems.' },
      { skillId: 'pandas', importance: 'core', whyItMatters: 'Indispensable for exploratory data analysis, wrangling, and feature creation.' },
      { skillId: 'sql', importance: 'core', whyItMatters: 'Required to extract training datasets from distributed data warehouses.' },
      { skillId: 'numpy', importance: 'supporting', whyItMatters: 'Underlies matrix operations and mathematical array computing.' },
      { skillId: 'data_visualization', importance: 'supporting', whyItMatters: 'Communicates model diagnostics and feature importance clearly.' },
      { skillId: 'scikit_learn', importance: 'supporting', whyItMatters: 'Standard toolkit for training, cross-validation, and production pipelines.' },
    ],
  },
  {
    id: 'ml_engineer',
    name: 'Machine Learning Engineer',
    summary: 'Designs, scales, and deploys machine learning models into reliable, high-throughput production infrastructure.',
    requiredSkills: [
      { skillId: 'python', importance: 'core', whyItMatters: 'Core ecosystem for implementing neural architectures and pipeline tooling.' },
      { skillId: 'machine_learning', importance: 'core', whyItMatters: 'Fundamental concepts of model architecture, optimization, and validation.' },
      { skillId: 'deep_learning', importance: 'core', whyItMatters: 'Enables training complex deep networks for perceptual and sequence tasks.' },
      { skillId: 'git', importance: 'core', whyItMatters: 'Essential for reproducible experiments, code reviews, and versioning.' },
      { skillId: 'numpy', importance: 'supporting', whyItMatters: 'Efficient numerical computations and low-level tensor manipulation.' },
      { skillId: 'docker', importance: 'supporting', whyItMatters: 'Packages models and dependencies for deterministic containerized serving.' },
      { skillId: 'rest_apis', importance: 'supporting', whyItMatters: 'Exposes model inference endpoints to downstream web and mobile applications.' },
      { skillId: 'dsa', importance: 'supporting', whyItMatters: 'Ensures optimal computational complexity and low inference latency.' },
    ],
  },
  {
    id: 'ai_nlp_engineer',
    name: 'AI/NLP Engineer',
    summary: 'Specializes in natural language processing, transformer architectures, text comprehension, and semantic intelligence.',
    requiredSkills: [
      { skillId: 'python', importance: 'core', whyItMatters: 'The universal language for NLP research, tokenizer pipelines, and tooling.' },
      { skillId: 'nlp', importance: 'core', whyItMatters: 'Text processing foundations: tokenization, TF-IDF, embeddings, and entity extraction.' },
      { skillId: 'deep_learning', importance: 'core', whyItMatters: 'Underlies modern recurrent and attention-based language models.' },
      { skillId: 'machine_learning', importance: 'core', whyItMatters: 'Required for classical classification baselines and loss optimization.' },
      { skillId: 'transformers', importance: 'supporting', whyItMatters: 'State-of-the-art architectures for semantic search, summarization, and generation.' },
      { skillId: 'git', importance: 'supporting', whyItMatters: 'Maintains codebase integrity and collaborative model training scripts.' },
      { skillId: 'rest_apis', importance: 'supporting', whyItMatters: 'Delivers real-time language intelligence via standardized microservices.' },
    ],
  },
  {
    id: 'python_backend_dev',
    name: 'Python Backend Developer',
    summary: 'Architects robust server-side APIs, background workers, database integrations, and distributed cloud services.',
    requiredSkills: [
      { skillId: 'python', importance: 'core', whyItMatters: 'Primary programming language for application servers and business logic.' },
      { skillId: 'sql', importance: 'core', whyItMatters: 'Writes performant queries, migrations, and transactional data structures.' },
      { skillId: 'rest_apis', importance: 'core', whyItMatters: 'Designs clean HTTP contracts, authentication flows, and resource payloads.' },
      { skillId: 'git', importance: 'core', whyItMatters: 'Standard version control workflow for continuous deployment and team collaboration.' },
      { skillId: 'python_web', importance: 'supporting', whyItMatters: 'Leverages FastAPI/Flask for rapid asynchronous endpoint development.' },
      { skillId: 'postgresql', importance: 'supporting', whyItMatters: 'Provides enterprise-grade ACID transactions and advanced query capabilities.' },
      { skillId: 'docker', importance: 'supporting', whyItMatters: 'Enables consistent staging environments and automated cloud deployments.' },
      { skillId: 'oop', importance: 'supporting', whyItMatters: 'Structures clean, maintainable, and modular service architectures.' },
    ],
  },
  {
    id: 'web_developer',
    name: 'Web Developer',
    summary: 'Constructs modern, responsive, accessible web interfaces and connected front-end user experiences.',
    requiredSkills: [
      { skillId: 'html', importance: 'core', whyItMatters: 'Provides semantic structure and accessibility foundations for all web content.' },
      { skillId: 'css', importance: 'core', whyItMatters: 'Handles responsive styling, layouts, animations, and visual brand identity.' },
      { skillId: 'javascript', importance: 'core', whyItMatters: 'Powers dynamic client interactivity, DOM operations, and asynchronous logic.' },
      { skillId: 'react', importance: 'core', whyItMatters: 'Modern declarative component architecture for scalable single-page apps.' },
      { skillId: 'git', importance: 'core', whyItMatters: 'Coordinates frontend code versioning and integration with CI pipelines.' },
      { skillId: 'typescript', importance: 'supporting', whyItMatters: 'Adds type safety and refactoring confidence to growing front-end codebases.' },
      { skillId: 'rest_apis', importance: 'supporting', whyItMatters: 'Integrates backend data endpoints with client-side state management.' },
    ],
  },
  {
    id: 'fullstack_developer',
    name: 'Full-Stack Developer',
    summary: 'Bridges user-facing interfaces and backend infrastructure to deliver end-to-end software applications.',
    requiredSkills: [
      { skillId: 'javascript', importance: 'core', whyItMatters: 'Unifies client-side browser logic and server-side runtimes.' },
      { skillId: 'react', importance: 'core', whyItMatters: 'Builds responsive, component-driven client applications.' },
      { skillId: 'sql', importance: 'core', whyItMatters: 'Manages relational databases and application persistence models.' },
      { skillId: 'git', importance: 'core', whyItMatters: 'Essential for branch management, code quality, and release cycles.' },
      { skillId: 'nodejs', importance: 'supporting', whyItMatters: 'Powers asynchronous backend services and microservice endpoints.' },
      { skillId: 'typescript', importance: 'supporting', whyItMatters: 'Shares type definitions seamlessly across frontend and backend boundaries.' },
      { skillId: 'html', importance: 'supporting', whyItMatters: 'Ensures semantic structure, SEO metadata, and WCAG compliance.' },
      { skillId: 'css', importance: 'supporting', whyItMatters: 'Ensures polished styling and responsive multi-device compatibility.' },
    ],
  },
  {
    id: 'data_engineer',
    name: 'Data Engineer',
    summary: 'Builds scalable data pipelines, data warehouses, and infrastructure for reliable data ingestion and transformation.',
    requiredSkills: [
      { skillId: 'python', importance: 'core', whyItMatters: 'Powers batch ETL scripts, orchestration DAGs, and pipeline automation.' },
      { skillId: 'sql', importance: 'core', whyItMatters: 'Defines analytical schemas, window functions, and data transformations.' },
      { skillId: 'git', importance: 'core', whyItMatters: 'Manages versioned data transformation scripts and CI/CD releases.' },
      { skillId: 'postgresql', importance: 'core', whyItMatters: 'Core relational engine for transactional data stores and operational staging.' },
      { skillId: 'docker', importance: 'supporting', whyItMatters: 'Containerizes pipeline workers and scheduler dependencies reliably.' },
      { skillId: 'linux', importance: 'supporting', whyItMatters: 'Navigates cloud servers, cron schedules, and log troubleshooting.' },
      { skillId: 'pandas', importance: 'supporting', whyItMatters: 'Performs rapid in-memory verification and cleaning of pipeline samples.' },
    ],
  },
];

export const CAREER_ROLES_MAP = new Map<string, CareerRole>(
  CAREER_ROLES.map((role) => [role.id, role])
);
