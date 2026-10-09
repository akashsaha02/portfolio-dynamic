export const profile = {
  name: "Akash Saha",
  role: "Full-stack developer",
  location: "Dhaka, Bangladesh",
  email: "akashsaha1313@gmail.com",
  github: "https://github.com/akashsaha02",
  linkedin: "https://www.linkedin.com/in/akashsaha02",
  intro:
    "Full-stack developer in Dhaka. I build SaaS products with MongoDB, Express, React and Node, and I’ve published research on deep learning for plant disease detection.",
  about:
    "I build web products end to end, from the database schema to the screen people tap. Right now that means a multi-tenant car rental platform at Nyntax: reservations, Stripe deposits, insurance pricing and toll handling. Before that I spent a year teaching neural networks to spot disease on tomato leaves.",
};

export type Role = {
  company: string;
  title: string;
  period: string;
  place: string;
  url?: string;
  points: string[];
};

export const experience: Role[] = [
  {
    company: "Nyntax",
    title: "MERN developer",
    period: "Nov 2025 – now",
    place: "Dhaka",
    url: "https://www.nyntax.com/",
    points: [
      "Build features for a multi-tenant car rental SaaS: quick reservations, car swaps and EZPass toll management.",
      "Integrated TeqMobility, Axle and Bonzah for insurance processing and licence verification.",
      "Built deposit handling and payment flows on Stripe, plus pricing logic that sets insurance premiums from vehicle value.",
    ],
  },
  {
    company: "Softvence Agency",
    title: "MERN stack developer",
    period: "Jul – Oct 2025",
    place: "Dhaka",
    url: "https://softvence.agency/",
    points: [
      "Shipped full-stack apps across SaaS, e-commerce and AI products on tight deadlines.",
      "Fixed production issues, improved stability and kept a library of reusable components.",
    ],
  },
  {
    company: "Deep learning research",
    title: "Undergraduate research assistant",
    period: "Aug 2024 – May 2025",
    place: "Bhubaneswar",
    points: [
      "Built a tomato leaf disease detector and compared five models: a custom CNN, VGG16, Xception, Inception V3 and DenseNet.",
      "VGG16 reached 96% accuracy after preprocessing and data augmentation.",
    ],
  },
  {
    company: "RNPsoft",
    title: "Web development intern",
    period: "Jan – Apr 2024",
    place: "Bhubaneswar",
    url: "https://rnpsoft.framer.website/",
    points: [
      "Built responsive interfaces with React, Vite and Tailwind CSS, wired to REST APIs.",
      "Added role-based authentication and real-time updates.",
    ],
  },
];

export type Project = {
  name: string;
  kind: string;
  period?: string;
  summary: string;
  stack: string[];
  url: string;
  linkLabel: string;
  repo?: string;
  // Screenshots of the live product.
  image?: { src: string; alt: string };
  phone?: { src: string; alt: string };
};

// First entry is the featured project.
export const projects: Project[] = [
  {
    name: "Abroadly",
    kind: "Study abroad agency platform",
    summary:
      "A full platform for a study abroad agency: students explore countries and universities, check eligibility and book consultations, in English or Bangla. Built as a monorepo with a Next.js frontend, an Express REST API and a shared types package. Supabase handles auth and data, Resend sends email, and GitHub Actions runs CI before deploying to Vercel and Render.",
    stack: ["Next.js", "Express", "TypeScript", "Supabase", "Resend", "GitHub Actions"],
    url: "https://study-abroad-five-mu.vercel.app",
    linkLabel: "Open Abroadly",
    repo: "https://github.com/akashsaha02/study-abroad",
    image: { src: "/projects/abroadly.webp", alt: "Abroadly home page: Study abroad with confidence" },
    phone: { src: "/projects/abroadly-phone.webp", alt: "Abroadly on a phone" },
  },
  {
    name: "Nook",
    kind: "Personal knowledge vault",
    summary:
      "One private place for notes, code, links and files. Rich text and code editors autosave with revisions, search reaches everything, and every change goes through authorised server actions. Unit and end-to-end tests run in CI.",
    stack: ["Next.js", "Prisma", "Supabase", "Better Auth", "Playwright"],
    url: "https://getnookspace.vercel.app/",
    linkLabel: "Open Nook",
    repo: "https://github.com/akashsaha02/knowledge-vault",
    image: { src: "/projects/nook.webp", alt: "Nook home page: Your space for things worth keeping" },
  },
  {
    name: "SoulMatch",
    kind: "Matrimony platform",
    period: "2024–25",
    summary:
      "Profiles, search and paid premium plans. Admin and member dashboards with filtering and sorting over biodata records, JWT and Firebase sign-in, Stripe subscriptions.",
    stack: ["MongoDB", "Express", "React", "Node", "Stripe"],
    url: "https://soulmatch-b2923.web.app/",
    linkLabel: "Open SoulMatch",
  },
  {
    name: "CrowdHex",
    kind: "Crowdfunding",
    period: "2024",
    summary:
      "Campaign pages and account management with Firebase Authentication and a light and dark theme.",
    stack: ["React", "Tailwind", "DaisyUI"],
    url: "https://crowdhex.web.app/",
    linkLabel: "Open CrowdHex",
  },
  {
    name: "Cerebral Insights",
    kind: "Brain tumour detection",
    period: "2024",
    summary: "Machine learning models that classify brain MRI scans for tumour detection.",
    stack: ["Python", "TensorFlow", "OpenCV"],
    url: "https://github.com/akashsaha02/cerebral-insights",
    linkLabel: "View code on GitHub",
  },
];

export type Publication = {
  title: string;
  venue: string;
  year: string;
  status: string;
  summary: string;
  url?: string;
};

export const publications: Publication[] = [
  {
    title: "Comparative Performance of Deep Learning Algorithms in Tomato Disease Detection",
    venue: "IEEE, 5th International Conference on Intelligent Technologies (CONIT)",
    year: "2025",
    status: "Published",
    summary:
      "Compares a custom CNN with transfer learning models for classifying tomato leaf disease. VGG16 reached 96% accuracy.",
    url: "https://doi.org/10.1109/CONIT63138.2025.11167239",
  },
  {
    title: "Integrating CNNs and Vision Transformers for Plant Disease Detection: A Systematic Review",
    venue: "Elsevier, Computers and Electronics in Agriculture",
    year: "2026",
    status: "Submitted",
    summary:
      "Reviews 100 papers from 2020 to 2025 on the trade-offs between accuracy, memory and field performance, and sets out a path toward lightweight, explainable models that farmers can actually run.",
  },
];

export const toolkit: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "Java", "C++", "C"] },
  { group: "Frameworks", items: ["React", "Next.js", "Express", "Tailwind CSS", "Flask", "TensorFlow", "OpenCV"] },
  { group: "Data", items: ["MongoDB", "SQL"] },
  { group: "Tools", items: ["Git", "AWS", "Firebase", "Stripe", "Postman", "Linux"] },
];

export const education = [
  {
    title: "B.Tech in Computer Science and Engineering",
    place: "Kalinga Institute of Industrial Technology, Bhubaneswar",
    period: "2021 – 2025",
    detail: "Graduated with 8.92 / 10. Studied on the Government of India's Study in India scholarship (75%).",
  },
];
