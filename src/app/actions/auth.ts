'use server';

import { prisma } from '@/lib/prisma';
import { createSession, clearSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function login(formData: FormData, roleFilter?: 'VICTIM' | 'AUTHORITY') {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

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

export async function loginVictimAction(prevState: any, formData: FormData) {
  return login(formData, 'VICTIM');
}

export async function loginAuthorityAction(prevState: any, formData: FormData) {
  return login(formData, 'AUTHORITY');
}

export async function createGuestSessionAction() {
  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);

  const user = await prisma.user.create({
    data: {
      email: `guest_${timestamp}@anonymous.local`,
      password: passwordHash,
      fullName: 'Guest User',
      icNumber: `GUEST-${timestamp}`,
      phoneNumber: `000000000${String(timestamp).slice(-1)}`,
      role: 'VICTIM',
    },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  redirect('/victim/dashboard');
}

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();
  const fullName = (formData.get('fullName') as string)?.trim();
  const icNumber = (formData.get('icNumber') as string)?.trim();
  const phoneNumber = (formData.get('phoneNumber') as string)?.trim();

  if (!fullName || !icNumber || !phoneNumber || !email || !password) {
    return {
      error: 'Full name, IC number, phone number, email, and password are required',
    };
  }

  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  if (icNumber.length < 6) {
    return { error: 'Please enter a valid IC number' };
  }

  if (phoneNumber.length < 9) {
    return { error: 'Please enter a valid phone number' };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

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
    },
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