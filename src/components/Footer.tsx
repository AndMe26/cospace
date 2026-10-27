'use client';

import { useLanguage } from '@/context/LanguageContext';

export function Footer(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
      &copy; {new Date().getFullYear()} CoSpace. {t.footer.rights}
    </footer>
  );
}