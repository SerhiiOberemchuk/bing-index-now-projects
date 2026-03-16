import { json } from "@sveltejs/kit";
import { z } from "zod";

import { getDb } from "$lib/server/db";
import { submitIndexNowUrls } from "$lib/server/indexnow/submit";
import { canManageProjects, MANAGE_PERMISSION_ERROR } from "$lib/server/authz";

const submitSchema = z.object({
  projectId: z.uuid(),
  urls: z.array(z.url()).min(1).max(10000),
});

export async function POST({ request, locals }) {
  if (!canManageProjects(locals.user)) {
    return json({ error: MANAGE_PERMISSION_ERROR }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      {
        error: "Validation failed",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const db = getDb();

  try {
    const result = await submitIndexNowUrls(
      db,
      parsed.data.projectId,
      parsed.data.urls,
    );
    return json(
      {
        submissionId: result.submissionId,
        bingResponse: {
          ok: result.ok,
          status: result.statusCode,
          body: result.responseBody,
        },
      },
      { status: result.ok ? 200 : 502 },
    );
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Could not submit URLs",
      },
      { status: 400 },
    );
  }
}
