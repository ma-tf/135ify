import { CONVEX_URL } from "@config";
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(CONVEX_URL);
