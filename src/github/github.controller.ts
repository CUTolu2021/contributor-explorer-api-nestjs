import { Controller, Get, Logger, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { GithubService } from './github.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('github') 
export class GithubController {
  private readonly logger = new Logger(GithubController.name);

  constructor(private readonly githubService: GithubService) {}

  /**
   * GET /github/repositories
   * Retrieves the list of Angular organization repositories.
   */
  @Get('repositories')
  async getAngularRepositories() {
    this.logger.log('Received request for Angular repositories.');

    const repositories = await this.githubService.getAngularRepositories();

    this.logger.log(`Returning ${repositories.length} repository names.`);
    
    return repositories.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
    }));
  }

  /**
   * GET /github/contributors
   * Fetches, aggregates, and returns the ranked list of all Angular contributors.
   */
  @Get('contributors')
  async getAggregatedContributors() {
    this.logger.log('Received request for aggregated contributors list.');
    
    const contributors = await this.githubService.aggregateContributors();

    this.logger.log(`Returning list of ${contributors.length} unique contributors.`);
    
    return contributors;
  }

  @Get('contributor/:login') 
  async getContributorDetails(@Param('login') login: string) { 
    this.logger.log(`Received request for contributor details: ${login}`);
    
    const details = await this.githubService.getSingleAggregatedContributor(login);

    if (!details) {
      this.logger.warn(`Contributor ${login} not found.`);
      return null;
    }
    
    this.logger.log(`Returning details for ${login}.`);
    return details;
  }
  
  @CacheTTL(3600 * 6) 
  @Get('repo/:repoName')
  async getRepoDetails(@Param('repoName') repoName: string) {
    this.logger.log(`Received request for repository details: ${repoName}`);
    
    const details = await this.githubService.getRepoDetailsWithContributors(repoName);

    if (!details) {
      this.logger.warn(`Repository ${repoName} not found.`);
      return null;
    }
    
    this.logger.log(`Returning details for repository ${repoName}.`);
    return details;
  }
}