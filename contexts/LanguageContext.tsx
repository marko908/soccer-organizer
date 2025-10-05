'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Language = 'pl' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pl')

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'pl' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['pl'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations: Record<Language, Record<string, string>> = {
  pl: {
    // Navigation
    'nav.home': 'Strona główna',
    'nav.dashboard': 'Panel',
    'nav.login': 'Logowanie',
    'nav.register': 'Rejestracja',
    'nav.logout': 'Wyloguj',

    // Home page
    'home.title': 'Foothub',
    'home.subtitle': 'Łatwo organizuj gry w piłkę i zarządzaj płatnościami',
    'home.description': 'Stwórz wydarzenie, udostępnij link i pozwól graczom się rejestrować i płacić online. Proste, szybkie i bezpieczne.',
    'home.getStarted': 'Rozpocznij teraz',
    'home.learnMore': 'Dowiedz się więcej',
    'home.newFeature': 'Nowe: Obsługa płatności gotówkowych dla organizatorów',
    'home.organizeTitle': 'Organizuj gry w piłkę',
    'home.organizeSubtitle': 'Jak profesjonalista',
    'home.heroDescription': 'Kompletne rozwiązanie do organizowania gier w piłkę z systemem płatności za grę. Twórz wydarzenia, zbieraj płatności natychmiast i zarządzaj uczestnikami bez wysiłku.',
    'home.goToDashboard': 'Przejdź do panelu',
    'home.createEvent': 'Stwórz wydarzenie',
    'home.getStartedFree': 'Rozpocznij za darmo',
    'home.signIn': 'Zaloguj się',
    'home.noSetupFees': 'Brak opłat konfiguracyjnych',
    'home.blikPayments': 'Płatności BLIK',
    'home.realTimeUpdates': 'Aktualizacje w czasie rzeczywistym',
    'home.everythingYouNeed': 'Wszystko czego potrzebujesz',
    'home.powerfulFeatures': 'Potężne funkcje ułatwiające organizowanie gier w piłkę',
    'home.quickEventCreation': 'Szybkie tworzenie wydarzeń',
    'home.quickEventDescription': 'Twórz wydarzenia w sekundach dzięki intuicyjnemu interfejsowi. Ustaw daty, lokalizacje i ceny z łatwością.',
    'home.securePayments': 'Bezpieczne płatności',
    'home.securePaymentsDescription': 'Zintegrowane płatności Stripe z pełną obsługą BLIK. Gracze płacą natychmiast i bezpiecznie, aby zagwarantować swoje miejsce.',
    'home.liveTracking': 'Śledzenie na żywo',
    'home.liveTrackingDescription': 'Listy uczestników w czasie rzeczywistym, status płatności i śledzenie postępów. Zawsze wiesz, kto przyjdzie grać.',
    'home.cashPayments': 'Płatności gotówkowe',
    'home.cashPaymentsDescription': 'Akceptuj płatności online i gotówkowe. Ręcznie dodawaj uczestników, którzy płacą osobiście dla pełnej elastyczności.',
    'home.smartAnalytics': 'Inteligentne analizy',
    'home.smartAnalyticsDescription': 'Śledź swoje wydarzenia za pomocą szczegółowych analiz. Monitoruj postęp zbiórki i zarządzaj wieloma grami bez wysiłku.',
    'home.organizerDashboard': 'Panel organizatora',
    'home.organizerDashboardDescription': 'Profesjonalny panel dla organizatorów. Zarządzaj wszystkimi wydarzeniami, uczestnikami i płatnościami w jednym miejscu.',
    'home.howItWorks': 'Jak to działa',
    'home.howItWorksDescription': 'Zorganizuj swoją grę w piłkę w 3 prostych krokach',
    'home.step1Title': 'Stwórz wydarzenie',
    'home.step1Description': 'Ustaw szczegóły gry: datę, lokalizację, całkowity koszt i maksymalną liczbę graczy',
    'home.step2Title': 'Udostępnij link',
    'home.step2Description': 'Udostępnij link do wydarzenia graczom. Mogą zapłacić natychmiast, aby zabezpieczyć swoje miejsce',
    'home.step3Title': 'Graj!',
    'home.step3Description': 'Śledź płatności w czasie rzeczywistym. Gdy osiągniesz wystarczającą liczbę graczy, zaczynajcie grę!',
    'home.readyToOrganize': 'Gotowy na zorganizowanie pierwszej gry?',
    'home.joinOrganizers': 'Dołącz do organizatorów, którzy ufają Foothub w swoich grach',
    'home.startFreeToday': 'Zacznij dziś za darmo',

    // Features
    'features.title': 'Dlaczego warto wybrać nasz organizator?',
    'features.event.title': 'Łatwe tworzenie wydarzeń',
    'features.event.description': 'Stwórz wydarzenie w kilka minut - wybierz datę, miejsce i koszty',
    'features.payment.title': 'Bezpieczne płatności',
    'features.payment.description': 'Płatności kartą i BLIK przez bezpieczny system Stripe',
    'features.management.title': 'Zarządzanie uczestnikami',
    'features.management.description': 'Śledź płatności i zarządzaj listą uczestników w czasie rzeczywistym',

    // Auth
    'auth.login.title': 'Zaloguj się',
    'auth.login.subtitle': 'Witaj z powrotem! Zaloguj się do swojego konta.',
    'auth.register.title': 'Stwórz konto',
    'auth.register.subtitle': 'Rozpocznij organizowanie gier już dziś.',
    'auth.email': 'Email',
    'auth.password': 'Hasło',
    'auth.name': 'Pełne imię i nazwisko',
    'auth.loginButton': 'Zaloguj się',
    'auth.registerButton': 'Zarejestruj się',
    'auth.noAccount': 'Nie masz konta?',
    'auth.hasAccount': 'Masz już konto?',
    'auth.signUp': 'Zarejestruj się',
    'auth.signIn': 'Zaloguj się',
    'auth.loading': 'Ładowanie...',
    'auth.loginFailed': 'Logowanie nieudane. Spróbuj ponownie.',
    'auth.registerFailed': 'Rejestracja nieudana. Spróbuj ponownie.',
    'auth.confirmEmail.verifying': 'Weryfikacja adresu email...',
    'auth.confirmEmail.pleaseWait': 'Proszę czekać, weryfikujemy Twoje konto.',
    'auth.confirmEmail.success': 'Email zweryfikowany!',
    'auth.confirmEmail.successMessage': 'Twoje konto zostało pomyślnie zweryfikowane. Możesz teraz korzystać ze wszystkich funkcji.',
    'auth.confirmEmail.error': 'Błąd weryfikacji',
    'auth.confirmEmail.errorMessage': 'Link weryfikacyjny jest nieprawidłowy lub wygasł.',
    'auth.confirmEmail.redirecting': 'Za chwilę zostaniesz przekierowany do panelu...',
    'auth.confirmEmail.goToDashboard': 'Przejdź do panelu',
    'auth.confirmEmail.backToLogin': 'Wróć do logowania',

    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.welcome': 'Witaj z powrotem',
    'dashboard.createEvent': 'Nowe wydarzenie',
    'dashboard.yourEvents': 'Twoje wydarzenia',
    'dashboard.loadingEvents': 'Ładowanie wydarzeń...',
    'dashboard.noEvents': 'Brak wydarzeń',
    'dashboard.noEventsDescription': 'Stwórz swoje pierwsze wydarzenie, aby rozpocząć!',
    'dashboard.players': 'Graczy',
    'dashboard.spotsLeft': 'Wolnych miejsc',
    'dashboard.collected': 'Zebrano',
    'dashboard.target': 'Cel',
    'dashboard.funded': 'finansowania',
    'dashboard.viewEvent': 'Zobacz wydarzenie',
    'dashboard.manage': 'Zarządzaj',

    // Create Event
    'create.title': 'Nowe wydarzenie',
    'create.eventName': 'Nazwa wydarzenia',
    'create.eventNamePlaceholder': 'np. Piątek 18:00 - Orlik Mokotów',
    'create.dateTime': 'Data i godzina',
    'create.location': 'Lokalizacja',
    'create.locationPlaceholder': 'np. Orlik Mokotów, ul. Sportowa 1',
    'create.totalCost': 'Całkowity koszt (PLN)',
    'create.maxPlayers': 'Max graczy',
    'create.pricePerPlayer': 'Cena za gracza:',
    'create.creating': 'Tworzenie...',
    'create.createEvent': 'Stwórz',
    'create.cancel': 'Anuluj',

    // Event Page
    'event.loading': 'Ładowanie wydarzenia...',
    'event.notFound': 'Wydarzenie nie znalezione',
    'event.notFoundDescription': 'Wydarzenie, którego szukasz, nie istnieje.',
    'event.paymentSuccess': '🎉 Płatność udana! Zabezpieczyłeś swoje miejsce w grze.',
    'event.paymentCanceled': 'Płatność została anulowana. Możesz spróbować ponownie, jeśli chcesz dołączyć do gry.',
    'event.collectionProgress': 'Postęp zbiórki',
    'event.complete': 'ukończone',
    'event.registered': 'Zarejestrowanych',
    'event.available': 'Dostępnych',
    'event.registeredPlayers': 'Zarejestrowani gracze',
    'event.noPlayers': 'Brak zarejestrowanych graczy',
    'event.joinGame': 'Dołącz do gry',
    'event.secureSpot': 'Zabezpiecz swoje miejsce płacąc',
    'event.payAndSignUp': 'Zapłać i zapisz się',
    'event.yourName': 'Twoje imię',
    'event.yourNamePlaceholder': 'Wprowadź swoje pełne imię',
    'event.email': 'Email (opcjonalnie)',
    'event.emailPlaceholder': 'twoj.email@example.com',
    'event.processing': 'Przetwarzanie...',
    'event.pay': 'Zapłać',
    'event.cancel': 'Anuluj',
    'event.paymentInfo': 'Płatności są przetwarzane bezpiecznie przez Stripe. Obsługiwane są płatności BLIK.',
    'event.eventFull': 'Wydarzenie jest pełne',
    'event.allSpotsTaken': 'Wszystkie miejsca zostały zajęte w tej grze.',
    'event.confirmed': '✓ Potwierdzony',
    'event.enterName': 'Proszę wprowadzić swoje imię',
    'event.copyLink': 'Skopiuj link',
    'event.copied': 'Skopiowano!',

    // Manage Event
    'manage.loading': 'Ładowanie...',
    'manage.title': 'Zarządzaj wydarzeniem',
    'manage.eventDetails': 'Szczegóły wydarzenia',
    'manage.participants': 'Uczestnicy',
    'manage.addParticipant': 'Dodaj uczestnika (płatność gotówką)',
    'manage.participantName': 'Imię uczestnika',
    'manage.participantNamePlaceholder': 'Wprowadź pełne imię',
    'manage.participantEmail': 'Email uczestnika (opcjonalnie)',
    'manage.participantEmailPlaceholder': 'email@example.com',
    'manage.adding': 'Dodawanie...',
    'manage.addParticipantButton': 'Dodaj uczestnika',
    'manage.noParticipants': 'Brak uczestników',
    'manage.remove': 'Usuń',
    'manage.backToDashboard': 'Powrót',
    'manage.shareEvent': 'Udostępnij wydarzenie',
    'manage.eventLink': 'Link do wydarzenia:',
    'manage.copyLink': 'Kopiuj link',
    'manage.linkCopied': 'Link skopiowany!',

    // Common
    'common.loading': 'Ładowanie...',
    'common.error': 'Błąd',
    'common.success': 'Sukces',
    'common.close': 'Zamknij',
    'common.save': 'Zapisz',
    'common.delete': 'Usuń',
    'common.edit': 'Edytuj',
    'common.view': 'Zobacz',
    'common.back': 'Wstecz',
    'common.next': 'Dalej',
    'common.previous': 'Poprzedni',
    'common.submit': 'Wyślij',
    'common.currency': 'PLN',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Organizer Dashboard',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',

    // Home page
    'home.title': 'Foothub',
    'home.subtitle': 'Easily organize football games and manage payments',
    'home.description': 'Create an event, share the link, and let players register and pay online. Simple, fast, and secure.',
    'home.getStarted': 'Get Started',
    'home.learnMore': 'Learn More',
    'home.newFeature': 'New: Cash payment support for organizers',
    'home.organizeTitle': 'Organize Football Games',
    'home.organizeSubtitle': 'Like a Pro',
    'home.heroDescription': 'The complete solution for organizing football games with a pay-to-play system. Create events, collect payments instantly, and manage participants effortlessly.',
    'home.goToDashboard': 'Go to Dashboard',
    'home.createEvent': 'Create Event',
    'home.getStartedFree': 'Get Started Free',
    'home.signIn': 'Sign In',
    'home.noSetupFees': 'No setup fees',
    'home.blikPayments': 'BLIK payments',
    'home.realTimeUpdates': 'Real-time updates',
    'home.everythingYouNeed': 'Everything you need',
    'home.powerfulFeatures': 'Powerful features to make organizing football games effortless',
    'home.quickEventCreation': 'Quick Event Creation',
    'home.quickEventDescription': 'Create events in seconds with our intuitive interface. Set dates, locations, and pricing with ease.',
    'home.securePayments': 'Secure Payments',
    'home.securePaymentsDescription': 'Integrated Stripe payments with full BLIK support. Players pay instantly and securely to guarantee their spot.',
    'home.liveTracking': 'Live Tracking',
    'home.liveTrackingDescription': 'Real-time participant lists, payment status, and progress tracking. Always know who\'s coming to play.',
    'home.cashPayments': 'Cash Payments',
    'home.cashPaymentsDescription': 'Accept both online and cash payments. Manually add participants who pay in person for complete flexibility.',
    'home.smartAnalytics': 'Smart Analytics',
    'home.smartAnalyticsDescription': 'Track your events with detailed analytics. Monitor collection progress and manage multiple games effortlessly.',
    'home.organizerDashboard': 'Organizer Dashboard',
    'home.organizerDashboardDescription': 'Professional dashboard for organizers. Manage all your events, participants, and payments in one place.',
    'home.howItWorks': 'How it works',
    'home.howItWorksDescription': 'Get your game organized in 3 simple steps',
    'home.step1Title': 'Create Event',
    'home.step1Description': 'Set up your game details: date, location, total cost, and max players',
    'home.step2Title': 'Share Link',
    'home.step2Description': 'Share your event link with players. They can pay instantly to secure their spot',
    'home.step3Title': 'Play Ball!',
    'home.step3Description': 'Track payments in real-time. When you reach enough players, game on!',
    'home.readyToOrganize': 'Ready to organize your first game?',
    'home.joinOrganizers': 'Join organizers who trust Foothub for their games',
    'home.startFreeToday': 'Start Free Today',

    // Features
    'features.title': 'Why choose our organizer?',
    'features.event.title': 'Easy Event Creation',
    'features.event.description': 'Create a match in minutes - choose date, location, and costs',
    'features.payment.title': 'Secure Payments',
    'features.payment.description': 'Card and BLIK payments through secure Stripe system',
    'features.management.title': 'Participant Management',
    'features.management.description': 'Track payments and manage participant lists in real-time',

    // Auth
    'auth.login.title': 'Login',
    'auth.login.subtitle': 'Welcome back! Please sign in to your account.',
    'auth.register.title': 'Create Account',
    'auth.register.subtitle': 'Start organizing games today.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.loginButton': 'Sign In',
    'auth.registerButton': 'Create Account',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signUp': 'Sign up',
    'auth.signIn': 'Sign in',
    'auth.loading': 'Loading...',
    'auth.loginFailed': 'Login failed. Please try again.',
    'auth.registerFailed': 'Registration failed. Please try again.',
    'auth.confirmEmail.verifying': 'Verifying your email...',
    'auth.confirmEmail.pleaseWait': 'Please wait while we verify your account.',
    'auth.confirmEmail.success': 'Email Verified!',
    'auth.confirmEmail.successMessage': 'Your account has been successfully verified. You can now access all features.',
    'auth.confirmEmail.error': 'Verification Error',
    'auth.confirmEmail.errorMessage': 'The verification link is invalid or has expired.',
    'auth.confirmEmail.redirecting': 'Redirecting you to dashboard...',
    'auth.confirmEmail.goToDashboard': 'Go to Dashboard',
    'auth.confirmEmail.backToLogin': 'Back to Login',

    // Dashboard
    'dashboard.title': 'Organizer Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.createEvent': 'Create New Event',
    'dashboard.yourEvents': 'Your Events',
    'dashboard.loadingEvents': 'Loading events...',
    'dashboard.noEvents': 'No events yet',
    'dashboard.noEventsDescription': 'Create your first event to get started!',
    'dashboard.players': 'Players',
    'dashboard.spotsLeft': 'Spots Left',
    'dashboard.collected': 'Collected',
    'dashboard.target': 'Target',
    'dashboard.funded': 'funded',
    'dashboard.viewEvent': 'View Event',
    'dashboard.manage': 'Manage',

    // Create Event
    'create.title': 'Create New Event',
    'create.eventName': 'Event Name',
    'create.eventNamePlaceholder': 'e.g., Friday 6PM - Orlik Mokotow',
    'create.dateTime': 'Date & Time',
    'create.location': 'Location',
    'create.locationPlaceholder': 'e.g., Orlik Mokotów, ul. Sportowa 1',
    'create.totalCost': 'Total Cost (PLN)',
    'create.maxPlayers': 'Max Players',
    'create.pricePerPlayer': 'Price per player:',
    'create.creating': 'Creating...',
    'create.createEvent': 'Create Event',
    'create.cancel': 'Cancel',

    // Event Page
    'event.loading': 'Loading event...',
    'event.notFound': 'Event Not Found',
    'event.notFoundDescription': "The event you're looking for doesn't exist.",
    'event.paymentSuccess': '🎉 Payment successful! You\'ve secured your spot in the game.',
    'event.paymentCanceled': 'Payment was canceled. You can try again if you\'d like to join the game.',
    'event.collectionProgress': 'Collection Progress',
    'event.complete': 'complete',
    'event.registered': 'Registered',
    'event.available': 'Available',
    'event.registeredPlayers': 'Registered Players',
    'event.noPlayers': 'No players registered yet',
    'event.joinGame': 'Join the Game',
    'event.secureSpot': 'Secure your spot by paying',
    'event.payAndSignUp': 'Pay & Sign Up',
    'event.yourName': 'Your Name',
    'event.yourNamePlaceholder': 'Enter your full name',
    'event.email': 'Email (optional)',
    'event.emailPlaceholder': 'your.email@example.com',
    'event.processing': 'Processing...',
    'event.pay': 'Pay',
    'event.cancel': 'Cancel',
    'event.paymentInfo': 'Payments are processed securely through Stripe. BLIK payments are supported.',
    'event.eventFull': 'Event is Full',
    'event.allSpotsTaken': 'All spots have been taken for this game.',
    'event.confirmed': '✓ Confirmed',
    'event.enterName': 'Please enter your name',
    'event.copyLink': 'Copy Link',
    'event.copied': 'Copied!',

    // Manage Event
    'manage.loading': 'Loading...',
    'manage.title': 'Manage Event',
    'manage.eventDetails': 'Event Details',
    'manage.participants': 'Participants',
    'manage.addParticipant': 'Add Participant (Cash Payment)',
    'manage.participantName': 'Participant Name',
    'manage.participantNamePlaceholder': 'Enter full name',
    'manage.participantEmail': 'Participant Email (optional)',
    'manage.participantEmailPlaceholder': 'email@example.com',
    'manage.adding': 'Adding...',
    'manage.addParticipantButton': 'Add Participant',
    'manage.noParticipants': 'No participants yet',
    'manage.remove': 'Remove',
    'manage.backToDashboard': 'Back to Dashboard',
    'manage.shareEvent': 'Share Event',
    'manage.eventLink': 'Event Link:',
    'manage.copyLink': 'Copy Link',
    'manage.linkCopied': 'Link copied!',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.currency': 'PLN',
  }
}