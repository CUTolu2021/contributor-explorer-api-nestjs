import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AggregatedContributor } from 'src/interfaces/aggregatedcontributor.interface';
import { RepositoryDetails } from 'src/interfaces/repositorydetails.interface';

function parseLinkHeader(header: string): { next?: string; last?: string } {
  if (!header) return {};
  const links: { [key: string]: string } = {};
  header.split(',').forEach((part) => {
    const section = part.split(';');
    if (section.length < 2) return;
    const url = section[0].replace(/<(.*)>/, '$1').trim();
    const name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });
  return links;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly GITHUB_ORG = 'angular';
  private readonly CONTRIBUTORS_CACHE_KEY = 'aggregated_contributors';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: any,
  ) {}

  /**
   * Fetches a list of all public repositories for the 'angular' organization.
   * @returns A Promise that resolves to an array of repository objects.
   */
  async getAngularRepositories(
    url?: string,
    allRepos: any[] = [],
  ): Promise<any[]> {
    const isFirstCall = url === undefined;

    // If this is the first call, use the base URL for page 1
    const apiUrl =
      url ||
      `https://api.github.com/orgs/${this.GITHUB_ORG}/repos?per_page=100`;

    if (isFirstCall) {
      this.logger.log(
        `Starting to fetch all repositories for ${this.GITHUB_ORG} (Page 1)...`,
      );
    }

    try {
      const response = await lastValueFrom(this.httpService.get(apiUrl));

      // 1. Add current page's repositories to the list
      allRepos.push(...response.data);

      // 2. Check the Link header for the next page
      const linkHeader = response.headers['link'];
      const links = parseLinkHeader(linkHeader);
      const nextUrl = links['next'];

      if (nextUrl) {
        // 3. Log and make the recursive call for the next page
        this.logger.log(
          `Fetched ${response.data.length} repos. Moving to the next page: ${nextUrl}`,
        );
        return this.getAngularRepositories(nextUrl, allRepos);
      } else {
        // 4. No more pages; return the complete list
        this.logger.log(
          `Successfully fetched ALL ${allRepos.length} repositories.`,
        );
        return allRepos;
      }
    } catch (error) {
      this.logger.error(
        'Error fetching repositories from GitHub:',
        error.message,
      );
      throw new Error('Failed to fetch repositories from GitHub.');
    }
  }

  private async getRepoContributors(
    repoName: string,
    url?: string,
    allContributors: any[] = [],
  ): Promise<any[]> {
    const isFirstCall = url === undefined;
    const apiUrl =
      url ||
      `https://api.github.com/repos/${this.GITHUB_ORG}/${repoName}/contributors?per_page=100`;

    if (isFirstCall) {
      this.logger.log(
        `Starting to fetch all contributors in ${repoName} repository for ${this.GITHUB_ORG} (Page 1)...`,
      );
    }

    try {
      const response = await lastValueFrom(this.httpService.get(apiUrl));

      // 1. Add current page's contributors to the list
      allContributors.push(...response.data);
      // 2. Check the Link header for the next page
      const linkHeader = response.headers['link'];
      const links = parseLinkHeader(linkHeader);
      const nextUrl = links['next'];

      if (nextUrl) {
        // 3. Log and make the recursive call for the next page
        this.logger.log(
          `Fetched ${response.data.length} contributors. Moving to the next page: ${nextUrl}`,
        );
        return this.getRepoContributors(repoName, nextUrl, allContributors);
      } else {
        // 4. No more pages; return the complete list
        this.logger.log(
          `Successfully fetched ALL ${allContributors.length} contributors.`,
        );
        return allContributors;
      }
    } catch (error) {
      this.logger.warn(
        `Could not fetch contributors for repo: ${repoName}. Skipping.`,
      );
      return [];
    }
  }

  /**
   * Main function to fetch and aggregate contributions from all repos.
   */
  async aggregateContributors(): Promise<AggregatedContributor[]> {
    // 1. Check the cache first
    const cachedData = await this.cacheManager.get(this.CONTRIBUTORS_CACHE_KEY);
    if (cachedData) {
      this.logger.log('Returning aggregated contributors from cache.');
      return cachedData;
    }

    this.logger.log('Starting contributor aggregation process...');

    // 1. Get the list of all repositories
    //const repos = await this.getAngularRepositories();
    const allRepos = await this.getAngularRepositories();

    // ⬇️ TEMPORARY CHANGE: Take only the first 2 repositories for testing ⬇️
    //const reposToProcess = allRepos.slice(0, 2);

    const repoNames = allRepos.map((repo) => repo.name);
    this.logger.log(`Processing all ${repoNames.length} repositories.`);
    //this.logger.log(`TEMPORARY TEST: Processing only ${repoNames.length} repositories to avoid rate limits.`);
    // This map will store our aggregated data, keyed by the contributor's login (username).
    const contributorsMap = new Map<string, AggregatedContributor>();

    // 2. Process contributors for all repositories in parallel
    // We use Promise.allSettled to allow some individual repo fetches to fail
    // without stopping the whole process.
    const results = await Promise.allSettled(
      repoNames.map(async (repoName) => {
        const repoContributors = await this.getRepoContributors(repoName);

        // 3. Aggregate data
        for (const contributor of repoContributors) {
          const login = contributor.login;
          const contributions = contributor.contributions || 0;

          if (!contributorsMap.has(login)) {
            // First time seeing this contributor
            contributorsMap.set(login, {
              login: login,
              totalContributions: 0,
              reposContributedTo: [],
            });
          }

          // Get the current entry and update it
          const currentData = contributorsMap.get(login)!; // Use non-null assertion as we just ensured it exists
          currentData.totalContributions += contributions;
          currentData.reposContributedTo.push(repoName);
          contributorsMap.set(login, currentData);
        }
      }),
    );

    // 4. Convert the Map back to an Array and retrieve basic logins
    let aggregatedList = Array.from(contributorsMap.values());
    this.logger.log(`Found ${aggregatedList.length} unique contributors.`);

    // 5. Fetch full GitHub details for each unique contributor
    aggregatedList = await this.fetchFullContributorDetails(aggregatedList);

    // 6. Store the final result in the cache before returning
    await this.cacheManager.set(this.CONTRIBUTORS_CACHE_KEY, aggregatedList);
    return aggregatedList;
  }

  async getSingleAggregatedContributor(
    login: string,
  ): Promise<AggregatedContributor | null> {
    this.logger.log(
      `Attempting to retrieve single contributor details for: ${login}`,
    );

    // 1. Get the full aggregated list from the cache
    // The list is retrieved as an array of AggregatedContributor objects.
    const cachedList: AggregatedContributor[] = await this.cacheManager.get(
      this.CONTRIBUTORS_CACHE_KEY,
    );

    // Safety check: If the cache is empty, we cannot find the contributor
    if (!cachedList || cachedList.length === 0) {
      this.logger.warn(
        'Cache is empty. Cannot retrieve single contributor details.',
      );
      return null;
    }

    // 2. Search the cached list for the requested login (case-insensitive)
    const contributor = cachedList.find(
      (c) => c.login.toLowerCase() === login.toLowerCase(),
    );

    if (contributor) {
      this.logger.log(`Found contributor ${login} in cache.`);
    } else {
      this.logger.warn(`Contributor ${login} not found in the cached list.`);
    }
    return contributor || null;
  }

  /**
   * Fetches detailed profile information for a contributor.
   */
  private async fetchContributorDetails(login: string): Promise<any> {
    const url = `https://api.github.com/users/${login}`;
    try {
      const response = await lastValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch details for user: ${login}`);
      return null;
    }
  }

  /**
   * Updates the aggregated list with full profile details.
   */
  private async fetchFullContributorDetails(
    list: AggregatedContributor[],
  ): Promise<AggregatedContributor[]> {
    this.logger.log(
      'Fetching full details for unique contributors. This might take a moment...',
    );

    const batchSize = 50; // Process 50 users at a time
    const updatedList: AggregatedContributor[] = [];

    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      this.logger.log(`Processing batch ${i / batchSize + 1}...`);

      // Use Promise.allSettled to fetch details for the current batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (contributor) => {
          const details = await this.fetchContributorDetails(contributor.login);
          if (details) {
            // Merge the full details into the aggregated object
            return {
              ...contributor,
              details: details,
              followers: details.followers,
              public_repos: details.public_repos,
              public_gists: details.public_gists,
            };
          }
          return contributor; // Return original if fetch failed
        }),
      );

      // Add successfully fetched and updated contributors to our final list
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          updatedList.push(result.value);
        }
      });
    }

    return updatedList;
  }

  private async fetchBasicRepoDetails(repoName: string): Promise<any> {
    const url = `https://api.github.com/repos/${this.GITHUB_ORG}/${repoName}`;
    try {
      const response = await lastValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch basic details for repo: ${repoName}`);
      return null;
    }
  }

  /**
   * Main function to fetch full repository details and its contributors.
   */
  async getRepoDetailsWithContributors(
    repoName: string,
  ): Promise<RepositoryDetails | null> {
    // Run two requests in parallel for speed:
    const [basicDetails, contributors] = await Promise.all([
      this.fetchBasicRepoDetails(repoName), // Basic details
      this.getRepoContributors(repoName), // Contributors (we reuse this from Step 4)
    ]);

    if (!basicDetails) {
      return null;
    }

    return {
      name: basicDetails.name,
      fullName: basicDetails.full_name,
      description: basicDetails.description,
      stargazers_count: basicDetails.stargazers_count,
      forks_count: basicDetails.forks_count,
      open_issues_count: basicDetails.open_issues_count,
      language: basicDetails.language,
      contributors: contributors.map((c) => ({
        login: c.login,
        contributions: c.contributions,
        avatar_url: c.avatar_url,
      })),
    };
  }
}
