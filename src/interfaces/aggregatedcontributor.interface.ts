export interface AggregatedContributor {
  login: string;
  totalContributions: number;
  reposContributedTo: string[];
  details?: any;
  followers?: number;
  public_repos?: number;
  public_gists?: number;
}