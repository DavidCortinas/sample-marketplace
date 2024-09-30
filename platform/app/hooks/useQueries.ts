import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  AdvancedParams,
  CategoryLabel,
  FormattedResult,
  Query,
} from "../types/recommendations/types";

export const useQueries = () => {
  const [savedQueries, setSavedQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const fetcher = useFetcher();

  const loadQueries = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/queries");
    }
  }, [fetcher]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    if (fetcher.data && !fetcher.data.error) {
      setSavedQueries(fetcher.data);
    }
  }, [fetcher.data]);

  const saveNewQuery = useCallback(
    (
      selections: FormattedResult[],
      category: CategoryLabel,
      advancedParams: AdvancedParams,
      queryName: string,
      recommendations: string[] // Add this new parameter
    ) => {
      console.log(selections);
      console.log(category);
      const newQuery = {
        name: queryName,
        parameters: {
          selections: selections.map((selection) => ({
            id: selection.id,
            name: selection.name,
            type: selection.type,
            artistName: selection.artistName,
            imageUrl: selection.imageUrl,
          })),
          category,
          advancedParams,
        },
        recommendations, // Add this new field
      };
      const formData = new FormData();
      formData.append("queryData", JSON.stringify(newQuery));
      fetcher.submit(formData, {
        method: "post",
        action: "/api/queries",
      });
    },
    [fetcher]
  );

  const selectQuery = useCallback((query: Query) => {
    setSelectedQuery({
      ...query,
      parameters: {
        ...query.parameters,
        advancedParams: query.parameters.advancedParams || {},
      },
      recommendations: query.recommendations || [],
    });
  }, []);

  return {
    savedQueries,
    loadQueries,
    saveNewQuery,
    selectQuery,
    selectedQuery,
    isLoading: fetcher.state !== "idle",
    queriesError: fetcher.data?.error,
  };
};
