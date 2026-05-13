import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import logger from '../../../lib/logger';

const querySchema = z.object({
  search: z.string().optional(),
  page:   z.coerce.number().int().min(0).default(0),
  role:   z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid query' });

  const { search, page, role: roleFilter } = parsed.data;

  try {
    // Get all roles and their users to build a userId→role map
    const roles = await authzAdmin.getRoles();
    const roleUserMap: Record<string, { roleId: string; roleName: string }> = {};

    await Promise.all(
      roles.map(async (r) => {
        const users = await authzAdmin.getUsersInRole({ id: r.id! });
        users.forEach((u) => {
          if (u.user_id) roleUserMap[u.user_id] = { roleId: r.id!, roleName: r.name! };
        });
      })
    );

    // Build query for Auth0
    const q = search
      ? `name:*${search}* OR email:*${search}*`
      : undefined;

    const users = await authzAdmin.getUsers({
      per_page: 25,
      page,
      include_totals: true,
      fields: 'user_id,name,email,picture,last_login,blocked,email_verified,created_at',
      ...(q ? { q, search_engine: 'v3' } : {}),
    } as any);

    const list = (Array.isArray(users) ? users : (users as any).users ?? []).map((u: any) => ({
      id:            u.user_id,
      name:          u.name,
      email:         u.email,
      picture:       u.picture,
      lastLogin:     u.last_login,
      blocked:       u.blocked ?? false,
      emailVerified: u.email_verified,
      createdAt:     u.created_at,
      role:          roleUserMap[u.user_id] ?? null,
    }));

    const filtered = roleFilter
      ? list.filter((u: any) => u.role?.roleName?.toLowerCase() === roleFilter.toLowerCase())
      : list;

    const total = (users as any).total ?? filtered.length;

    return res.status(200).json({ result: 'success', users: filtered, total, roles });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Failed to fetch users' });
  }
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), ['admin:dashboards']);
