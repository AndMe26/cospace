'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export function HomeHero(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t.home.title1}{' '}
          <span className="text-indigo-600">{t.home.titleHighlight}</span>{' '}
          {t.home.title2}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          {t.home.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/spaces"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition-colors text-base"
          >
            {t.home.exploreBtn}
          </Link>
          <Link
            href="/register"
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold px-8 py-3 rounded-xl border border-gray-300 shadow-sm transition-colors text-base"
          >
            {t.home.registerBtn}
          </Link>
        </div>
      </div>
    </div>
  );
}