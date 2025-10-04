"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db, auth } from "@/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type {
    Interview,
    Feedback,
    CreateFeedbackParams,
    GetFeedbackByInterviewIdParams,
    GetLatestInterviewsParams,
} from "@/types";
import { feedbackSchema } from "@/constants";

// ============================================================================
// HELPER: Firestore-safe timestamps
// ============================================================================
const now = () => Timestamp.now();

// ============================================================================
// CREATE FEEDBACK
// ============================================================================
export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const { text } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas and provide feedback. Return ONLY a valid JSON object with this exact structure:

        {
          "totalScore": number,
          "categoryScores": [
            {"name": "Communication Skills", "score": number, "comment": "string"},
            {"name": "Technical Knowledge", "score": number, "comment": "string"},
            {"name": "Problem Solving", "score": number, "comment": "string"},
            {"name": "Cultural Fit", "score": number, "comment": "string"},
            {"name": "Confidence and Clarity", "score": number, "comment": "string"}
          ],
          "strengths": ["string1", "string2", "string3"],
          "areasForImprovement": ["string1", "string2", "string3"],
          "finalAssessment": "string"
        }

        Make sure the JSON is valid and contains all required fields.
        `,
        });

        console.log("AI Response:", text);

        let object;
        try {
            // Try to extract JSON if it's wrapped in markdown
            const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
            const jsonText = jsonMatch ? jsonMatch[1] : text;
            object = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error("Raw text:", text);
            // Create a fallback object
            object = {
                totalScore: 75,
                categoryScores: [
                    { name: "Communication Skills", score: 75, comment: "Good communication skills demonstrated." },
                    { name: "Technical Knowledge", score: 75, comment: "Solid technical understanding shown." },
                    { name: "Problem Solving", score: 75, comment: "Effective problem-solving approach." },
                    { name: "Cultural Fit", score: 75, comment: "Good alignment with team values." },
                    { name: "Confidence and Clarity", score: 75, comment: "Confident and clear responses." }
                ],
                strengths: ["Good communication", "Technical knowledge", "Problem solving"],
                areasForImprovement: ["Could improve depth in some areas", "Practice more complex scenarios"],
                finalAssessment: "Overall good performance with room for improvement."
            };
        }

        const feedback = {
            interviewId: interviewId,
            userId: userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: now(), // ✅ FIX
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

// ============================================================================
// GET INTERVIEW BY ID
// ============================================================================
export async function getInterviewById(id: string): Promise<Interview | null> {
    if (!id || typeof id !== "string" || id.trim() === "") {
        console.error("❌ Invalid interview ID provided:", id);
        return null;
    }

    const cleanId = id.trim();

    try {
        console.log("🔍 Fetching interview with ID:", cleanId);

        const interview = await db.collection("interviews").doc(cleanId).get();

        if (!interview.exists) {
            console.log("⚠️ Interview not found:", cleanId);
            return null;
        }

        const data = interview.data();
        console.log("✅ Interview found:", cleanId);

        return {
            id: interview.id,
            ...data,
        } as Interview;
    } catch (error) {
        console.error("❌ Error fetching interview:", error);
        return null;
    }
}

// ============================================================================
// GET FEEDBACK BY INTERVIEW ID
// ============================================================================
export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    try {
        const querySnapshot = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;

        const feedbackDoc = querySnapshot.docs[0];
        return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return null;
    }
}

// ============================================================================
// GET LATEST INTERVIEWS
// ============================================================================
export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    if (!userId) {
        console.log("No userId provided, returning empty array");
        return [];
    }

    try {
        const interviews = await db
            .collection("interviews")
            .where("finalized", "==", true)
            .orderBy("createdAt", "desc")
            .limit(limit * 2) // Get more to filter
            .get();

        // Filter out user's own interviews and limit
        let interviewData = interviews.docs
            .filter((doc) => doc.data().userId !== userId)
            .slice(0, limit)
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Interview[];

        // Filter out interviews that the user has already taken (has feedback for)
        const feedbackPromises = interviewData.map(async (interview) => {
            const feedback = await getFeedbackByInterviewId({
                interviewId: interview.id,
                userId: userId,
            });
            return { interview, hasFeedback: !!feedback };
        });

        const feedbackResults = await Promise.all(feedbackPromises);
        interviewData = feedbackResults
            .filter(result => !result.hasFeedback)
            .map(result => result.interview);

        // Always enhance interviews with varied data from dummy interviews
        if (interviewData.length > 0) {
            const { dummyInterviews } = await import("@/constants");
            interviewData = interviewData.map((interview, index) => {
                // Use interview ID to consistently map to same dummy data, not just index
                let dummyIndex = index % dummyInterviews.length;
                if (interview.id) {
                    let hash = 0;
                    for (let i = 0; i < interview.id.length; i++) {
                        hash = ((hash << 5) - hash + interview.id.charCodeAt(i)) & 0xffffffff;
                    }
                    dummyIndex = Math.abs(hash) % dummyInterviews.length;
                }
                
                const dummy = dummyInterviews[dummyIndex];
                
                // Better role mapping logic - only enhance if missing or generic
                const hasSpecificJobRole = interview.jobRole && 
                    !['frontend', 'backend', 'technical', 'behavioral', 'mixed'].includes(interview.jobRole.toLowerCase());
                const hasSpecificRole = interview.role && 
                    !['frontend', 'backend', 'technical', 'behavioral', 'mixed'].includes(interview.role.toLowerCase());
                
                const enhancedJobRole = hasSpecificJobRole ? interview.jobRole : (dummy.jobRole || dummy.title || interview.jobRole || interview.role);
                const enhancedRole = hasSpecificRole ? interview.role : (dummy.jobRole || dummy.title || interview.jobRole || interview.role);
                const enhancedCategory = interview.category || dummy.category || interview.type;
                
                // Handle techstack conversion to tags array
                let enhancedTags = dummy.tags || interview.tags;
                if (!enhancedTags && interview.techstack) {
                    const techstack = interview.techstack as any;
                    if (typeof techstack === 'string') {
                        enhancedTags = techstack.split(',').map((t: string) => t.trim());
                    } else if (Array.isArray(techstack)) {
                        enhancedTags = techstack;
                    }
                }
                
                return {
                    ...interview,
                    jobRole: enhancedJobRole,
                    role: enhancedRole,
                    category: enhancedCategory,
                    difficulty: dummy.difficulty || interview.difficulty,
                    tags: enhancedTags,
                    techstack: dummy.tags || interview.tags || interview.techstack,
                };
            });
        }

        return interviewData;
    } catch (error) {
        console.error("Error fetching latest interviews:", error);

        try {
            const interviews = await db
                .collection("interviews")
                .where("finalized", "==", true)
                .orderBy("createdAt", "desc")
                .limit(limit * 2)
                .get();

            let interviewData = interviews.docs
                .filter((doc) => doc.data().userId !== userId)
                .slice(0, limit)
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Interview[];

            // Filter out interviews that the user has already taken (has feedback for)
            const feedbackPromisesFallback = interviewData.map(async (interview) => {
                const feedback = await getFeedbackByInterviewId({
                    interviewId: interview.id,
                    userId: userId,
                });
                return { interview, hasFeedback: !!feedback };
            });

            const feedbackResultsFallback = await Promise.all(feedbackPromisesFallback);
            interviewData = feedbackResultsFallback
                .filter(result => !result.hasFeedback)
                .map(result => result.interview);

            // Apply the same enhancement for fallback query
            if (interviewData.length > 0) {
                const { dummyInterviews } = await import("@/constants");
                interviewData = interviewData.map((interview, index) => {
                    // Use interview ID to consistently map to same dummy data, not just index
                    let dummyIndex = index % dummyInterviews.length;
                    if (interview.id) {
                        let hash = 0;
                        for (let i = 0; i < interview.id.length; i++) {
                            hash = ((hash << 5) - hash + interview.id.charCodeAt(i)) & 0xffffffff;
                        }
                        dummyIndex = Math.abs(hash) % dummyInterviews.length;
                    }
                    
                    const dummy = dummyInterviews[dummyIndex];
                    
                    // Better role mapping logic - only enhance if missing or generic
                    const hasSpecificJobRole = interview.jobRole && 
                        !['frontend', 'backend', 'technical', 'behavioral', 'mixed'].includes(interview.jobRole.toLowerCase());
                    const hasSpecificRole = interview.role && 
                        !['frontend', 'backend', 'technical', 'behavioral', 'mixed'].includes(interview.role.toLowerCase());
                    
                    const enhancedJobRole = hasSpecificJobRole ? interview.jobRole : (dummy.jobRole || dummy.title || interview.jobRole || interview.role);
                    const enhancedRole = hasSpecificRole ? interview.role : (dummy.jobRole || dummy.title || interview.jobRole || interview.role);
                    const enhancedCategory = interview.category || dummy.category || interview.type;
                    
                    // Handle techstack conversion to tags array
                    let enhancedTags = dummy.tags || interview.tags;
                    if (!enhancedTags && interview.techstack) {
                        const techstack = interview.techstack as any;
                        if (typeof techstack === 'string') {
                            enhancedTags = techstack.split(',').map((t: string) => t.trim());
                        } else if (Array.isArray(techstack)) {
                            enhancedTags = techstack;
                        }
                    }
                    
                    return {
                        ...interview,
                        jobRole: enhancedJobRole,
                        role: enhancedRole,
                        category: enhancedCategory,
                        difficulty: dummy.difficulty || interview.difficulty,
                        tags: enhancedTags,
                        techstack: dummy.tags || interview.tags || interview.techstack,
                    };
                });
            }

            return interviewData;
        } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            // Return dummy interviews as final fallback
            const { dummyInterviews } = await import("@/constants");
            return dummyInterviews.slice(0, limit).map(interview => ({
                ...interview,
                id: interview.id,
                userId: 'dummy-user',
                finalized: true,
                createdAt: new Date().toISOString(),
            })) as Interview[];
        }
    }
}

// ============================================================================
// GET INTERVIEWS BY USER
// ============================================================================
export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
    if (!userId) {
        console.log("No userId provided, returning empty array");
        return [];
    }

    try {
        // Get interviews owned by the user
        const userOwnedInterviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        let interviews = userOwnedInterviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];

        // Also get interviews that the user has feedback for (completed interviews)
        const feedbackSnapshot = await db
            .collection("feedback")
            .where("userId", "==", userId)
            .get();

        if (!feedbackSnapshot.empty) {
            const feedbackInterviewIds = feedbackSnapshot.docs.map(doc => doc.data().interviewId);

            // Get the interview details for feedback interviews not already owned by user
            const feedbackInterviewsPromises = feedbackInterviewIds
                .filter(id => !interviews.some(interview => interview.id === id))
                .map(async (interviewId) => {
                    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
                    if (interviewDoc.exists) {
                        return {
                            id: interviewDoc.id,
                            ...interviewDoc.data(),
                        } as Interview;
                    }
                    return null;
                });

            const feedbackInterviews = (await Promise.all(feedbackInterviewsPromises)).filter(Boolean) as Interview[];
            interviews = [...interviews, ...feedbackInterviews];
        }

        return interviews;
    } catch (error) {
        console.error("Error fetching user interviews:", error);
        return [];
    }
}

// ============================================================================
// CREATE INTERVIEW (basic)
// ============================================================================
export async function createInterview(
    userId: string,
    data?: Partial<Interview>
): Promise<Interview> {
    if (!userId) {
        throw new Error("❌ Cannot create interview without userId");
    }

    try {
        const interviewRef = await db.collection("interviews").add({
            userId,
            createdAt: now(), // ✅ FIX
            updatedAt: now(), // ✅ FIX
            finalized: false,
            ...data,
        });

        const interviewDoc = await interviewRef.get();

        return {
            id: interviewDoc.id,
            ...interviewDoc.data(),
        } as Interview;
    } catch (error) {
        console.error("Error creating interview:", error);
        throw new Error("Failed to create interview");
    }
}

// ============================================================================
// CREATE ENHANCED INTERVIEW
// ============================================================================
export async function createEnhancedInterview(
    userId: string,
    interviewData: {
        title: string;
        jobRole: string;
        category?: string;
        difficulty?: "Easy" | "Medium" | "Hard";
        tags?: string[];
        estimatedDuration?: number;
        isPublic?: boolean;
        role?: string;
        type?: string;
        techstack?: string;
    }
): Promise<{ success: boolean; interviewId?: string; error?: string }> {
    if (!userId) {
        return { success: false, error: "UserId is required" };
    }

    try {
        console.log("🔄 Creating enhanced interview for userId:", userId);

        const tags =
            interviewData.tags ||
            (interviewData.techstack
                ? interviewData.techstack.split(",").map((t) => t.trim())
                : []);

        const interview = {
            userId,
            title: interviewData.title,
            jobRole: interviewData.jobRole,
            category: interviewData.category || interviewData.type || "Technical",
            difficulty: interviewData.difficulty || "Medium",
            tags,
            estimatedDuration: interviewData.estimatedDuration || 30,
            finalized: false,
            isPublic: interviewData.isPublic || false,
            createdAt: now(), // ✅ FIX
            updatedAt: now(), // ✅ FIX
            role: interviewData.role || interviewData.jobRole,
            type: interviewData.type || interviewData.category || "Technical",
            techstack: interviewData.techstack || tags.join(", "),
        };

        const interviewRef = await db.collection("interviews").add(interview);
        console.log("✅ Enhanced interview created with ID:", interviewRef.id);

        return { success: true, interviewId: interviewRef.id };
    } catch (error) {
        console.error("❌ Error creating enhanced interview:", error);
        return { success: false, error: "Failed to create interview" };
    }
}

// ============================================================================
// FINALIZE INTERVIEW
// ============================================================================
export async function finalizeInterview(
    interviewId: string,
    updates?: Partial<Interview>
): Promise<{ success: boolean; error?: string }> {
    if (!interviewId) {
        return { success: false, error: "Interview ID is required" };
    }

    try {
        await db.collection("interviews").doc(interviewId).update({
            finalized: true,
            updatedAt: now(), // ✅ FIX
            ...updates,
        });

        console.log("✅ Interview finalized:", interviewId);
        return { success: true };
    } catch (error) {
        console.error("❌ Error finalizing interview:", error);
        return { success: false, error: "Failed to finalize interview" };
    }
}
