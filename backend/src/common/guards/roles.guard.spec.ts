import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(role?: Role): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  afterEach(() => vi.restoreAllMocks());

  it('allows any authenticated user when no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(Role.Buyer))).toBe(true);
  });

  it('allows a user with a required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.Admin,
      Role.Staff,
    ]);
    expect(guard.canActivate(contextFor(Role.Staff))).toBe(true);
  });

  it('denies a user without a required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextFor(Role.Buyer))).toBe(false);
  });

  it('denies a request without a user', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextFor())).toBe(false);
  });
});
