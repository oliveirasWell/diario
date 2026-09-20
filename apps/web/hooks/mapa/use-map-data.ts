"use client";

import { useQuery } from "@tanstack/react-query";
import { mapDataQueryOptions } from "@/lib/query-options";

export const useMapDataQuery = () => useQuery(mapDataQueryOptions());
