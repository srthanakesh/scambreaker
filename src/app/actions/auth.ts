'use server';

import { prisma } from '@/lib/prisma';
import { createSession, clearSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function login(formData: FormData, roleFilter?: 'VICTIM' | 'AUTHORITY') {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid credentials' };
  }

  if (roleFilter && user.role !== roleFilter) {
    return { error: `Must be a ${roleFilter.toLowerCase()} to log in here` };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  if (user.role === 'VICTIM') {
    redirect('/victim/dashboard');
  } else {
    redirect('/authority/dashboard');
  }
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const icNumber = formData.get('icNumber') as string;
  const phoneNumber = formData.get('phoneNumber') as string;

  if (!email || !password || !fullName) {
    return { error: 'Email, password, and full name are required' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already registered' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      fullName,
      icNumber,
      phoneNumber,
      role: 'VICTIM',
    }
  });

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  redirect('/victim/dashboard');
}

export async function logout() {
  await clearSession();
  redirect('/');
}
