import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover, getInterviewTitle } from "@/lib/utils";
import type { RouteParams } from "@/types";

import {
    getFeedbackByInterviewId,
    getInterviewById,
    createEnhancedInterview,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: RouteParams) => {
    const { id } = await params;

    const user = await getCurrentUser();

    let interview = await getInterviewById(id);
    if (!interview) redirect("/");

    console.log("Interview page - Interview userId:", interview.userId, "Current userId:", user?.id);

    // If this interview doesn't belong to the current user, create a personal copy
    if (interview.userId !== user?.id) {
        console.log("Creating personal interview copy for user:", user?.id);
        console.log("Original interview userId:", interview.userId, "Current userId:", user?.id);

        const { success, interviewId: newInterviewId } = await createEnhancedInterview(user?.id!, {
            title: interview.title || getInterviewTitle({
                id: interview.id,
                jobRole: interview.jobRole,
                role: interview.role,
                category: interview.category,
                type: interview.type
            }),
            jobRole: interview.jobRole || interview.role,
            category: interview.category || interview.type,
            difficulty: interview.difficulty,
            tags: interview.tags || interview.techstack,
            estimatedDuration: interview.estimatedDuration || 30,
            isPublic: false,
            role: interview.role,
            type: interview.type,
            techstack: Array.isArray(interview.techstack) ? interview.techstack.join(", ") : interview.techstack,
        });

        console.log("Create interview result:", { success, newInterviewId });

        if (success && newInterviewId) {
            console.log("Redirecting to new personal interview:", newInterviewId);
            redirect(`/interview/${newInterviewId}`);
        } else {
            console.error("Failed to create personal interview copy");
            redirect("/");
        }
    }

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id!,
    });

    return (
        <>
            <div className="flex flex-row gap-4 justify-between">
                <div className="flex flex-row gap-4 items-center max-sm:flex-col">
                    <div className="flex flex-row gap-4 items-center">
                        <Image
                            src={getRandomInterviewCover()}
                            alt="cover-image"
                            width={40}
                            height={40}
                            className="rounded-full object-cover size-[40px]"
                        />
                        <h3 className="capitalize">{getInterviewTitle({
                            id: interview.id,
                            jobRole: interview.jobRole,
                            role: interview.role,
                            category: interview.category,
                            type: interview.type
                        })}</h3>
                    </div>

                    <DisplayTechIcons techStack={interview.techstack} />
                </div>

                <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
                    {interview.type}
                </p>
            </div>

            <Agent
                userName={user?.name!}
                userId={user?.id}
                interviewId={id}
                type="interview"
                questions={interview.questions}
                feedbackId={feedback?.id}
            />
        </>
    );
};

export default InterviewDetails;
