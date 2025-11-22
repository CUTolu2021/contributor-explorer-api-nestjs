import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, 
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string | object;
    if (exception instanceof HttpException) {
      errorMessage = exception.getResponse();
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    } else {
      errorMessage = 'An unknown internal error occurred';
    }

     
    this.logger.error(
      `HTTP Error: ${httpStatus} on ${request.path}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

   
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message: errorMessage,
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}