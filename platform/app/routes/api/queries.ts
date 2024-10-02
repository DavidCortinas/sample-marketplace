import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { authenticatedFetch } from "../../utils/api.server";
import { getSession, commitSession } from "../../session.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const response = await authenticatedFetch("/spotify/queries/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      request,
    });

    const queries = await response.json();
    return json(queries);
  } catch (error) {
    console.error("Error fetching queries:", error);
    if (
      error instanceof Error &&
      error.message.includes("Please log in again")
    ) {
      return json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }
    return json({ error: "Failed to fetch queries" }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const session = await getSession(request);

  try {
    const formData = await request.formData();
    const queryDataString = formData.get("queryData") as string;

    let queryData;
    try {
      queryData = JSON.parse(queryDataString);
    } catch (error) {
      console.error("Error parsing queryData:", error);
      return json({ error: "Invalid query data format" }, { status: 400 });
    }

    // Process queryData
    const processedQueryData = {
      name: queryData.name,
      parameters: {
        selections: queryData.parameters.selections.map((selection: any) => ({
          id: selection.id,
          name: selection.name,
          type: selection.type,
          artistName: selection.artistName,
          imageUrl: selection.imageUrl,
        })),
        category: queryData.parameters.category,
        advancedParams: queryData.parameters.advancedParams,
      },
      recommendations: queryData.recommendations,
    };

    const response = await authenticatedFetch("/spotify/queries/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedQueryData),
      request,
    });

    const savedQuery = await response.json();
    return json(savedQuery);
  } catch (error) {
    console.error("Error saving query:", error);
    return json(
      { error: "Failed to save query" },
      {
        status: 500,
        headers: { "Set-Cookie": await commitSession(session) },
      }
    );
  }
};
