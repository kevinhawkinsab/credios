import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = host.switchToHttp().getRequest<{ url: string }>();
    const result = this.mapException(exception);

    response.status(result.statusCode).json({
      statusCode: result.statusCode,
      errorCode: result.errorCode,
      message: result.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapException(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message = typeof response === 'string'
        ? response
        : (response as { message?: string | string[] }).message ?? exception.message;
      return { statusCode: exception.getStatus(), errorCode: this.codeFor(exception.getStatus()), message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      return { statusCode: HttpStatus.CONFLICT, errorCode: 'DUPLICATE_RESOURCE', message: 'El correo o la cédula ya están registrados' };
    }

    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, errorCode: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado' };
  }

  private codeFor(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
    };
    return codes[statusCode] ?? 'HTTP_ERROR';
  }
}
