import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
    "react.js": "react",
    reactjs: "react",
    react: "react",
    "next.js": "nextjs",
    nextjs: "nextjs",
    next: "nextjs",
    "vue.js": "vuejs",
    vuejs: "vuejs",
    vue: "vuejs",
    "express.js": "express",
    expressjs: "express",
    express: "express",
    "node.js": "nodejs",
    nodejs: "nodejs",
    node: "nodejs",
    mongodb: "mongodb",
    mongo: "mongodb",
    mongoose: "mongoose",
    mysql: "mysql",
    postgresql: "postgresql",
    sqlite: "sqlite",
    firebase: "firebase",
    docker: "docker",
    kubernetes: "kubernetes",
    aws: "aws",
    azure: "azure",
    gcp: "gcp",
    digitalocean: "digitalocean",
    heroku: "heroku",
    photoshop: "photoshop",
    "adobe photoshop": "photoshop",
    html5: "html5",
    html: "html5",
    css3: "css3",
    css: "css3",
    sass: "sass",
    scss: "sass",
    less: "less",
    tailwindcss: "tailwindcss",
    tailwind: "tailwindcss",
    bootstrap: "bootstrap",
    jquery: "jquery",
    typescript: "typescript",
    ts: "typescript",
    javascript: "javascript",
    js: "javascript",
    "angular.js": "angular",
    angularjs: "angular",
    angular: "angular",
    "ember.js": "ember",
    emberjs: "ember",
    ember: "ember",
    "backbone.js": "backbone",
    backbonejs: "backbone",
    backbone: "backbone",
    nestjs: "nestjs",
    graphql: "graphql",
    "graph ql": "graphql",
    apollo: "apollo",
    webpack: "webpack",
    babel: "babel",
    "rollup.js": "rollup",
    rollupjs: "rollup",
    rollup: "rollup",
    "parcel.js": "parcel",
    parceljs: "parcel",
    npm: "npm",
    yarn: "yarn",
    git: "git",
    github: "github",
    gitlab: "gitlab",
    bitbucket: "bitbucket",
    figma: "figma",
    prisma: "prisma",
    redux: "redux",
    flux: "flux",
    redis: "redis",
    selenium: "selenium",
    cypress: "cypress",
    jest: "jest",
    mocha: "mocha",
    chai: "chai",
    karma: "karma",
    vuex: "vuex",
    "nuxt.js": "nuxt",
    nuxtjs: "nuxt",
    nuxt: "nuxt",
    strapi: "strapi",
    wordpress: "wordpress",
    contentful: "contentful",
    netlify: "netlify",
    vercel: "vercel",
    "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
    name: "Interviewer",
    firstMessage:
        "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience. Let's start with our first question.",
    transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
    },
    voice: {
        provider: "11labs",
        voiceId: "sarah",
        stability: 0.4,
        similarityBoost: 0.8,
        speed: 0.9,
        style: 0.5,
        useSpeakerBoost: true,
    },
    model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
You have these questions to ask: {{questions}}

IMPORTANT: Ask questions ONE AT A TIME. After each question, wait for the candidate's response before asking the next question.

Flow:
1. Start with a brief introduction
2. Ask the first question from the list
3. After they answer, acknowledge their response briefly, then ask the next question
4. Continue this pattern until all questions are asked
5. After the last question, thank them and end the interview

Engage naturally & react appropriately:
- Listen actively to responses and acknowledge them before moving forward
- Ask brief follow-up questions if a response is vague or requires more detail
- Keep the conversation flowing smoothly while maintaining control
- Be professional, yet warm and welcoming

Response style:
- Use official yet friendly language
- Keep responses concise and to the point (like in a real voice interview)
- Avoid robotic phrasing—sound natural and conversational
- Answer the candidate's questions professionally

Conclude the interview properly:
- Thank the candidate for their time
- Inform them that the company will reach out soon with feedback
- End the conversation on a polite and positive note

Remember: This is a voice conversation, so keep your responses short and natural. Don't ramble.`,
            },
        ],
    },
};

export const feedbackSchema = z.object({
    totalScore: z.number(),
    categoryScores: z.tuple([
        z.object({
            name: z.literal("Communication Skills"),
            score: z.number(),
            comment: z.string(),
        }),
        z.object({
            name: z.literal("Technical Knowledge"),
            score: z.number(),
            comment: z.string(),
        }),
        z.object({
            name: z.literal("Problem Solving"),
            score: z.number(),
            comment: z.string(),
        }),
        z.object({
            name: z.literal("Cultural Fit"),
            score: z.number(),
            comment: z.string(),
        }),
        z.object({
            name: z.literal("Confidence and Clarity"),
            score: z.number(),
            comment: z.string(),
        }),
    ]),
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    finalAssessment: z.string(),
});

export const interviewCovers = [
    "/adobe.png",
    "/amazon.png",
    "/facebook.png",
    "/hostinger.png",
    "/pinterest.png",
    "/quora.png",
    "/reddit.png",
    "/skype.png",
    "/spotify.png",
    "/telegram.png",
    "/tiktok.png",
    "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
    {
        id: "1",
        userId: "user1",
        role: "Backend Developer",
        jobRole: "Backend Developer",
        type: "Technical",
        category: "Backend",
        techstack: ["Java", "Spring", "Microservices", "Kafka"],
        tags: ["Java", "Spring", "Microservices", "Kafka"],
        level: "Senior",
        difficulty: "Hard",
        questions: ["What is Spring Boot?"],
        finalized: true,
        createdAt: "2024-03-15T10:00:00Z",
    },
    {
        id: "2",
        userId: "user1",
        role: "DevOps Engineer",
        jobRole: "DevOps Engineer",
        type: "Technical",
        category: "DevOps",
        techstack: ["Docker", "Kubernetes", "AWS", "Terraform"],
        tags: ["Docker", "Kubernetes", "AWS", "Terraform"],
        level: "Senior",
        difficulty: "Hard",
        questions: ["What is Docker?"],
        finalized: true,
        createdAt: "2024-03-14T15:30:00Z",
    },
    {
        id: '3',
        title: 'Full Stack Developer',
        company: 'Google',
        jobRole: 'Full Stack Developer',
        category: 'Full Stack',
        difficulty: 'Medium',
        estimatedDuration: 45,
        rating: 4.5,
        participants: 2156,
        tags: ['React', 'Node.js', 'MongoDB', 'Express'],
        logo: '🔵',
        color: 'bg-blue-500',
        userId: 'other-user-3',
        finalized: true,
        isPublic: true
    },
    {
        id: '4',
        title: 'Frontend Developer',
        company: 'Spotify',
        jobRole: 'Frontend Developer',
        category: 'Frontend',
        difficulty: 'Medium',
        estimatedDuration: 40,
        rating: 4.6,
        participants: 1654,
        tags: ['Vue.js', 'CSS', 'JavaScript', 'GraphQL'],
        logo: '🟡',
        color: 'bg-yellow-500',
        userId: 'other-user-4',
        finalized: true,
        isPublic: true
    },
    {
        id: '5',
        title: 'Data Scientist',
        company: 'Meta',
        jobRole: 'Data Scientist',
        category: 'Data Science',
        difficulty: 'Hard',
        estimatedDuration: 60,
        rating: 4.9,
        participants: 756,
        tags: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas'],
        logo: '🟦',
        color: 'bg-blue-600',
        userId: 'other-user-5',
        finalized: true,
        isPublic: true
    },
    {
        id: '6',
        title: 'Mobile Developer',
        company: 'Apple',
        jobRole: 'Mobile Developer',
        category: 'Mobile',
        difficulty: 'Medium',
        estimatedDuration: 50,
        rating: 4.3,
        participants: 1234,
        tags: ['Swift', 'iOS', 'UIKit', 'Core Data'],
        logo: '⚫',
        color: 'bg-gray-800',
        userId: 'other-user-6',
        finalized: true,
        isPublic: true
    },
    {
        id: '7',
        title: 'UI/UX Designer',
        company: 'Adobe',
        jobRole: 'UI/UX Designer',
        category: 'Design',
        difficulty: 'Easy',
        estimatedDuration: 35,
        rating: 4.2,
        participants: 2341,
        tags: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
        logo: '🟣',
        color: 'bg-purple-500',
        userId: 'other-user-7',
        finalized: true,
        isPublic: true
    },
    {
        id: '8',
        title: 'Security Engineer',
        company: 'Microsoft',
        jobRole: 'Security Engineer',
        category: 'Security',
        difficulty: 'Hard',
        estimatedDuration: 55,
        rating: 4.7,
        participants: 543,
        tags: ['Cybersecurity', 'Penetration Testing', 'OWASP', 'Encryption'],
        logo: '🔴',
        color: 'bg-red-600',
        userId: 'other-user-8',
        finalized: true,
        isPublic: true
    }
];
