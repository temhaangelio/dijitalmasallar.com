export type AiCandidateStatus = "pending" | "rejected" | "published";

export type AiNewsCandidate = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  titleTr: string;
  titleEn: string;
  contentTr: string;
  contentEn: string;
  status: AiCandidateStatus;
  createdAt: string;
};

export type AiNewsDiscovery = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  title: string;
  titleTr: string;
  createdAt: string;
};

export type OfficialAiSource = {
  name: string;
  url: string;
  host: string;
};
