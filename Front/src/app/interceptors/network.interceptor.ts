import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

export const networkInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retry({
      count: 2,
      delay: (error) => {
        if (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)) {
          return timer(500);
        }
        return throwError(() => error);
      },
    }),
  );
};
