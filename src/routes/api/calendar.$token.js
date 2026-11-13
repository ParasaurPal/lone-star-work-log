import { createFileRoute } from "@tanstack/react-router";
import { buildInterviewFeed } from "@/lib/ics";

export const Route = createFileRoute("/api/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params, context }) => {
        const localStore = context.getLocalStore();

        const feedResult = await localStore.asServiceRole.entities.CalendarFeed.filter({
          token: params.token,
        });
        const feeds = Array.isArray(feedResult) ? feedResult : feedResult?.items ?? [];
        const feed = feeds[0];

        if (!feed || feed.enabled === false) {
          return new Response("Calendar not found", { status: 404 });
        }

        const interviewResult = await localStore.asServiceRole.entities.Interview.filter(
          { created_by_id: feed.created_by_id },
          { sort: "interview_date_time", limit: 500 },
        );
        const interviews = Array.isArray(interviewResult)
          ? interviewResult
          : interviewResult?.items ?? [];

        return new Response(buildInterviewFeed(interviews), {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="lonestar-worklog.ics"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});