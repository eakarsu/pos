import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Set BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin for this one-time operation');
  }

  const email = (process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  const displayName = (process.env.PROVISION_ADMIN_NAME || 'Runtime Acceptance').trim().split(/\s+/);
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid administrator email is required');
  if (password.length < 12 || Buffer.byteLength(password) > 72) throw new Error('Administrator password must be 12 to 72 bytes');

  const usernameBase = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '_').slice(0, 32) || 'administrator';
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (process.env.NODE_ENV === 'production') throw new Error('Administrator already exists; refusing to overwrite it');
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: displayName[0] || 'Runtime',
          lastName: displayName.slice(1).join(' ') || 'Administrator',
          password: await bcrypt.hash(password, 12),
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
        },
      });
      console.log(`Reconciled administrator ${user.id}`);
      return;
    }
    let username = usernameBase;
    for (let suffix = 1; await prisma.user.findUnique({ where: { username } }); suffix += 1) username = `${usernameBase.slice(0, 27)}_${suffix}`;
    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName: displayName[0] || 'Runtime',
        lastName: displayName.slice(1).join(' ') || 'Administrator',
        password: await bcrypt.hash(password, 12),
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`Provisioned administrator ${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrator provisioning failed');
  process.exitCode = 1;
});
