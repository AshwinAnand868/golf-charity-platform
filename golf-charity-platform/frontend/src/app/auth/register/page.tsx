'use client';

import { Suspense } from 'react';
import RegisterContent from './RegisterContent';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}