import { meydanApi } from "@/lib/meydan-api";
import type { FeedPost, FollowSuggestion } from "../types";
import {
  buildSquareMap,
  mapFollowSuggestion,
  mapNarrative,
  type ApiNarrative,
  type ApiSquare,
} from "./feed.mapper";

async function getSquares(): Promise<ApiSquare[]> {
  return meydanApi<ApiSquare[]>("/squares");
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const [narratives, squares] = await Promise.all([
    meydanApi<ApiNarrative[]>("/timeline?mode=for_you&filter=all"),
    getSquares(),
  ]);
  const squareMap = buildSquareMap(squares);
  return narratives.map((item) => mapNarrative(item, squareMap));
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  const squares = await meydanApi<ApiSquare[]>("/squares?verified=1");
  return squares.slice(0, 6).map(mapFollowSuggestion);
}
