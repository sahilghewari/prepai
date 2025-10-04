import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

/**
 * Normalize a tech name (case-insensitive, strip ".js", spaces, etc.)
 * Returns either a mapped value, the cleaned key, or "default".
 */
const normalizeTechName = (tech: string): string => {
    if (!tech) return "default";

    const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");

    return mappings[key as keyof typeof mappings] || key || "default";
};

/**
 * Check if an icon URL exists.
 */
const checkIconExists = async (url: string) => {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Build an array of logos (with fallback if URL missing).
 */
export const getTechLogos = async (techArray?: string[]) => {
    if (!Array.isArray(techArray) || techArray.length === 0) {
        return [];
    }

    const logoURLs = techArray.map((tech) => {
        const normalized = normalizeTechName(tech);

        return {
            tech,
            url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
        };
    });

    const results = await Promise.all(
        logoURLs.map(async ({ tech, url }) => ({
            tech,
            url: (await checkIconExists(url)) ? url : "/tech.svg", // fallback local placeholder
        }))
    );

    return results;
};

/**
 * Pick a random interview cover.
 */
export const getRandomInterviewCover = () => {
    const randomIndex = Math.floor(Math.random() * interviewCovers.length);
    return `/covers${interviewCovers[randomIndex]}`;
};

/**
 * Get the appropriate interview title based on interview data
 */
export const getInterviewTitle = (interview: {
    interviewId?: string;
    id?: string;
    jobRole?: string;
    role?: string;
    category?: string;
    type?: string;
}) => {
    const { interviewId, id, jobRole, role, category, type } = interview;
    const actualId = interviewId || id;
    
    // Special case: if jobRole exists and is different from role, prioritize jobRole
    if (jobRole && jobRole !== role && jobRole.toLowerCase() !== 'frontend developer') {
        return `${jobRole} Interview`;
    }
    
    // If we have a good role that's not the generic "Frontend Developer" that seems to be the default
    if (role && role.toLowerCase() !== 'frontend developer' && 
        !['frontend', 'backend', 'technical', 'behavioral', 'mixed', 'fullstack', 'full stack'].includes(role.toLowerCase()) &&
        role.toLowerCase() !== 'interview') {
        return `${role} Interview`;
    }
    
    // Use interview ID to create variety - cycle through different role types
    const roleVariations = [
        'Software Engineer',
        'Full Stack Developer', 
        'Backend Developer',
        'DevOps Engineer',
        'Data Scientist',
        'Mobile Developer',
        'UI/UX Designer',
        'Security Engineer',
        'Product Manager',
        'Software Architect',
        'Technical Lead',
        'Systems Developer'
    ];
    
    // Use interview ID hash to pick a consistent role for each interview
    if (actualId) {
        let hash = 0;
        for (let i = 0; i < actualId.length; i++) {
            hash = ((hash << 5) - hash + actualId.charCodeAt(i)) & 0xffffffff;
        }
        const index = Math.abs(hash) % roleVariations.length;
        return `${roleVariations[index]} Interview`;
    }
    
    // Fallback to smart category mapping
    const interviewCategory = category || type;
    if (interviewCategory) {
        // Map categories to more descriptive titles
        const categoryTitleMap: Record<string, string> = {
            'frontend': 'Frontend Developer',
            'backend': 'Backend Developer', 
            'fullstack': 'Full Stack Developer',
            'full stack': 'Full Stack Developer',
            'devops': 'DevOps Engineer',
            'mobile': 'Mobile Developer',
            'data science': 'Data Scientist',
            'security': 'Security Engineer',
            'design': 'UI/UX Designer',
            'technical': 'Software Engineer',
            'behavioral': 'Behavioral Assessment',
            'mixed': 'Comprehensive Assessment'
        };
        
        const mappedTitle = categoryTitleMap[interviewCategory.toLowerCase()];
        if (mappedTitle) {
            return `${mappedTitle} Interview`;
        }
        
        // Capitalize first letter if no mapping found
        return `${interviewCategory.charAt(0).toUpperCase() + interviewCategory.slice(1)} Interview`;
    }
    
    return "Software Engineer Interview"; // Better default than just "Interview"
};
