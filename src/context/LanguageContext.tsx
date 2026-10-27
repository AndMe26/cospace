'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

export type Language = 'es' | 'en';

interface Translations {
  nav: {
    home: string;
    spaces: string;
    dashboard: string;
    admin: string;
    login: string;
    register: string;
    logout: string;
  };
  home: {
    title1: string;
    titleHighlight: string;
    title2: string;
    subtitle: string;
    exploreBtn: string;
    registerBtn: string;
  };
  footer: {
    rights: string;
  };
}

const dictionaries: Record<Language, Translations> = {
  es: {
    nav: {
      home: 'Inicio',
      spaces: 'Espacios',
      dashboard: 'Mis Reservas',
      admin: 'Panel Admin',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      logout: 'Cerrar Sesión',
    },
    home: {
      title1: 'Reserva espacios de trabajo',
      titleHighlight: 'profesionales',
      title2: 'en segundos',
      subtitle:
        'Encuentra oficinas privadas, salas de juntas y escritorios flexibles listos para potenciar tu productividad y la de tu equipo.',
      exploreBtn: 'Explorar Espacios',
      registerBtn: 'Crear una Cuenta',
    },
    footer: {
      rights: 'Todos los derechos reservados.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      spaces: 'Spaces',
      dashboard: 'My Bookings',
      admin: 'Admin Panel',
      login: 'Sign In',
      register: 'Sign Up',
      logout: 'Logout',
    },
    home: {
      title1: 'Book',
      titleHighlight: 'professional',
      title2: 'workspaces in seconds',
      subtitle:
        'Find private offices, meeting rooms, and flexible desks ready to boost your team productivity.',
      exploreBtn: 'Explore Spaces',
      registerBtn: 'Create an Account',
    },
    footer: {
      rights: 'All rights reserved.',
    },
  },
};

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const STORAGE_KEY = 'app_language';

export function LanguageProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        setLang(saved);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSetLang = useCallback((newLang: Language): void => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const contextValue = useMemo(
    () => ({
      lang,
      setLang: handleSetLang,
      t: dictionaries[lang],
    }),
    [lang, handleSetLang]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextProps {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}