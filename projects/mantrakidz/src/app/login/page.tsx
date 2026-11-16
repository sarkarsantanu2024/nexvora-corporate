import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usingNeon } from '@/db';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '' } = await searchParams;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div aria-hidden className="absolute right-16 top-40 h-16 w-16 animate-float rounded-3xl bg-sun-400/90" />
        <div aria-hidden className="absolute bottom-40 right-40 h-10 w-10 animate-float rounded-full bg-mint-400/90 [animation-delay:1.5s]" />
        <div aria-hidden className="absolute bottom-24 left-24 h-12 w-12 animate-wiggle rounded-2xl bg-coral-400/90" />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1.5">
            <Image src="/brand/mark.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
          </span>
          <span>
            <span className="block font-display text-2xl font-bold leading-tight">Mantra Kidz</span>
            <span className="block text-sm text-brand-200">A Play School</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white">One place to run every centre.</h1>
          <p className="mt-4 text-lg text-brand-100">
            Admissions, attendance, fees, royalty and the website, for head office, every franchise centre and every parent.
          </p>
        </div>
        <p className="relative text-sm text-brand-300">A unit of Mind Mantra Abacus</p>
      </div>

      {/* form side */}
      <div className="flex items-center justify-center bg-white px-5 py-10">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/brand/mark.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-display text-2xl font-bold text-brand-800">Mantra Kidz</span>
          </Link>
          <h2 className="font-display text-3xl font-bold text-ink-900">Welcome back</h2>
          <p className="mt-1 text-ink-500">Log in to your Mantra Kidz account.</p>

          <LoginForm next={next} showDemo={!usingNeon()} />

          <p className="mt-8 text-center text-sm text-ink-500">
            <Link href="/" className="font-semibold text-brand-700 hover:underline">
              ← Back to the website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
