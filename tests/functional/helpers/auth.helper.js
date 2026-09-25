/**
 * ResQ Hub — Functional Test Auth Helper
 * Generates signed JWTs matching @crp/shared-middleware specifications.
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'Callofduty4&';

export function generateTestToken({
  userId,
  email,
  globalRoles = ['USER'],
  organizationId = null,
  orgRole = null,
  expiresIn = '1h'
}) {
  const payload = {
    sub: userId,
    email,
    globalRoles,
    ...(organizationId && { organizationId }),
    ...(orgRole && { orgRole })
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export const TEST_USERS = {
  COORDINATOR: {
    userId: 'c0000000-0000-0000-0000-000000000001',
    email: 'kasun.coordinator@resqhub.test',
    globalRoles: ['USER'],
    orgRole: 'COORDINATOR'
  },
  CITIZEN: {
    userId: 'c0000000-0000-0000-0000-000000000002',
    email: 'nuwan.citizen@resqhub.test',
    globalRoles: ['USER']
  },
  VOLUNTEER: {
    userId: 'c0000000-0000-0000-0000-000000000003',
    email: 'amara.volunteer@resqhub.test',
    globalRoles: ['VOLUNTEER']
  },
  SUPER_ADMIN: {
    userId: 'c0000000-0000-0000-0000-000000000005',
    email: 'superadmin@resqhub.test',
    globalRoles: ['SUPER_ADMIN']
  }
};
