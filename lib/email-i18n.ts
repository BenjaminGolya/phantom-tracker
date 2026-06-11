import { type Locale, DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

// Localized strings for user-facing transactional emails.
// Functions interpolate dynamic values (code, name, date, url).

type Hi = (name?: string | null) => string;

export type EmailStrings = {
  verifySubject: (code: string) => string;
  verifyHeading: string;
  verifyIntro: string; // mentions 15 minutes
  verifyIgnore: string;
  welcomeSubject: string;
  welcomeHeading: string;
  welcomeHi: Hi;
  welcomeLine: string;
  welcomeBtn: string;
  resetSubject: string;
  resetHeading: string;
  resetHi: Hi;
  resetLine: string; // mentions 1 hour
  resetBtn: string;
  resetIgnore: string;
  twoFASubject: (code: string) => string;
  twoFAHeading: string;
  twoFAHi: Hi;
  twoFALine: string; // 10 minutes
  twoFAIgnore: string;
  ecConfirmSubject: string;
  ecConfirmHeading: string;
  ecConfirmHi: Hi;
  ecConfirmLine: (newEmail: string) => string;
  ecConfirmBtn: string;
  ecConfirmIgnore: string;
  ecNoticeSubject: string;
  ecNoticeHeading: string;
  ecNoticeHi: Hi;
  ecNoticeLine: (newEmail: string) => string;
  ecNoticeWarn: string;
  disabledSubject: string;
  disabledHeading: string;
  disabledHi: Hi;
  disabledLine: string;
  disabledBtn: string;
  delSubject: string;
  delHeading: string;
  delHi: Hi;
  delLine1: (days: number, when: string) => string;
  delLine2: (when: string) => string;
  delBtn: string;
  reactSubject: string;
  reactHeading: string;
  reactHi: Hi;
  reactLine: string;
  reactBtn: string;
  // Feedback / support acknowledgement (sent to the user)
  fbAckSubject: string;
  fbAckHeading: string;
  fbAckHi: Hi;
  fbAckLine: string;
  fbAckYour: string;
  fbAckClosing: string;
  // Weekly summary
  wsSubject: string;
  wsHeading: string;
  wsHi: Hi;
  wsIntro: string;
  wsCompletions: string;
  wsBestStreak: string;
  wsPerfectDays: string;
  wsClosing: string;
  wsBtn: string;
  // Trial ending
  trialSubject: (days: number) => string;
  trialHeading: string;
  trialHi: Hi;
  trialLine: (days: number) => string;
  trialBtn: string;
};

const en: EmailStrings = {
  verifySubject: (c) => `${c} is your Phantom Tracker verification code`,
  verifyHeading: "Verify your email address",
  verifyIntro: "Enter this 6-digit code to complete your registration. It expires in 15 minutes.",
  verifyIgnore: "If you didn't create an account, you can safely ignore this email.",
  welcomeSubject: "Welcome to Phantom Tracker 👻",
  welcomeHeading: "Welcome to Phantom Tracker",
  welcomeHi: (n) => (n ? `Hey ${n}, your account is verified and you're in. 🎉` : "Hey there, your account is verified and you're in. 🎉"),
  welcomeLine: "Create your first habit, check it off each day, and watch your streaks, levels, and Phantom score grow. Set reminders so you never miss a day.",
  welcomeBtn: "Open Phantom Tracker",
  resetSubject: "Reset your Phantom Tracker password",
  resetHeading: "Reset your password",
  resetHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  resetLine: "We got a request to reset your password. Tap the button to choose a new one. This link expires in 1 hour.",
  resetBtn: "Reset password",
  resetIgnore: "If you didn't request this, just ignore this email and your password stays the same.",
  twoFASubject: (c) => `${c} is your Phantom Tracker login code`,
  twoFAHeading: "Your login code",
  twoFAHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  twoFALine: "Enter this code to finish signing in. It expires in 10 minutes.",
  twoFAIgnore: "If you didn't try to sign in, change your password immediately.",
  ecConfirmSubject: "Confirm your new Phantom Tracker email",
  ecConfirmHeading: "Confirm your new email",
  ecConfirmHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  ecConfirmLine: (e) => `You asked to change your Phantom Tracker email to ${e}. Tap the button to confirm. The link expires in 1 hour.`,
  ecConfirmBtn: "Confirm new email",
  ecConfirmIgnore: "If you didn't request this, you can safely ignore this email.",
  ecNoticeSubject: "A Phantom Tracker email change was requested",
  ecNoticeHeading: "Email change requested",
  ecNoticeHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  ecNoticeLine: (e) => `A request was made to change your account email to ${e}. It only takes effect once confirmed from that new address.`,
  ecNoticeWarn: "If this wasn't you, please change your password right away.",
  disabledSubject: "Your Phantom Tracker account has been disabled",
  disabledHeading: "Account disabled",
  disabledHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  disabledLine: "Your account has been disabled. Reminders are paused and the app is locked, but all your data is kept safe. Sign back in any time to reactivate instantly.",
  disabledBtn: "Reactivate my account",
  delSubject: "Your Phantom Tracker account is scheduled for deletion",
  delHeading: "Account scheduled for deletion",
  delHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  delLine1: (d, w) => `Your account is scheduled for permanent deletion. You have a ${d}-day grace period, so change your mind any time before ${w} and everything is restored.`,
  delLine2: (w) => `After ${w}, your account and all related data will be permanently erased and cannot be recovered.`,
  delBtn: "Keep my account",
  reactSubject: "Your Phantom Tracker account is active again 👻",
  reactHeading: "You're back!",
  reactHi: (n) => (n ? `Welcome back, ${n}! 🎉` : "Welcome back! 🎉"),
  reactLine: "Your account has been reactivated and all your habits and history are intact. Any pending deletion has been cancelled.",
  reactBtn: "Open Phantom Tracker",
  fbAckSubject: "We got your message. Phantom Tracker",
  fbAckHeading: "Thanks for reaching out",
  fbAckHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  fbAckLine: "We've received your message and a human will get back to you with an answer as soon as we can. Here's a copy of what you sent:",
  fbAckYour: "Your message",
  fbAckClosing: "Thanks for helping make Phantom Tracker better. 👻",
  wsSubject: "Your week in review. Phantom Tracker",
  wsHeading: "Your week in review",
  wsHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  wsIntro: "Here's how your last 7 days went:",
  wsCompletions: "Completions",
  wsBestStreak: "Best active streak",
  wsPerfectDays: "Perfect days",
  wsClosing: "Keep it going: every check-in counts. 👻",
  wsBtn: "Open your dashboard",
  trialSubject: (d) => `Your Pro trial ends in ${d} day${d === 1 ? "" : "s"}`,
  trialHeading: "Your Pro trial is ending soon",
  trialHi: (n) => (n ? `Hi ${n},` : "Hi there,"),
  trialLine: (d) => `Your free Pro trial ends in ${d} day${d === 1 ? "" : "s"}. Keep your unlimited habits, reminders, and advanced stats by staying on Pro: or do nothing and you'll simply move to the free plan.`,
  trialBtn: "Manage my plan",
};

const hu: EmailStrings = {
  verifySubject: (c) => `${c} a Phantom Tracker megerősítő kódod`,
  verifyHeading: "Erősítsd meg az e-mail-címed",
  verifyIntro: "Írd be ezt a 6 jegyű kódot a regisztráció befejezéséhez. 15 perc múlva lejár.",
  verifyIgnore: "Ha nem te hoztál létre fiókot, nyugodtan hagyd figyelmen kívül ezt az e-mailt.",
  welcomeSubject: "Üdvözlünk a Phantom Trackerben 👻",
  welcomeHeading: "Üdvözlünk a Phantom Trackerben",
  welcomeHi: (n) => (n ? `Szia ${n}, a fiókod megerősítve, és már bent is vagy! 🎉` : "Szia, a fiókod megerősítve, és már bent is vagy! 🎉"),
  welcomeLine: "Hozd létre az első szokásod, jelöld be naponta, és nézd, ahogy a sorozataid, szintjeid és Phantom pontszámod nő. Állíts be emlékeztetőket, hogy egy napot se hagyj ki.",
  welcomeBtn: "Phantom Tracker megnyitása",
  resetSubject: "Állítsd vissza a Phantom Tracker jelszavad",
  resetHeading: "Jelszó visszaállítása",
  resetHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  resetLine: "Kérést kaptunk a jelszavad visszaállítására. Koppints a gombra egy új jelszó megadásához. Ez a link 1 óra múlva lejár.",
  resetBtn: "Jelszó visszaállítása",
  resetIgnore: "Ha nem te kérted ezt, hagyd figyelmen kívül, a jelszavad változatlan marad.",
  twoFASubject: (c) => `${c} a Phantom Tracker bejelentkezési kódod`,
  twoFAHeading: "A bejelentkezési kódod",
  twoFAHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  twoFALine: "Írd be ezt a kódot a bejelentkezés befejezéséhez. 10 perc múlva lejár.",
  twoFAIgnore: "Ha nem te próbáltál belépni, azonnal változtasd meg a jelszavad.",
  ecConfirmSubject: "Erősítsd meg az új Phantom Tracker e-mail-címed",
  ecConfirmHeading: "Erősítsd meg az új e-mail-címed",
  ecConfirmHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  ecConfirmLine: (e) => `Azt kérted, hogy a Phantom Tracker e-mail-címed erre változzon: ${e}. Koppints a gombra a megerősítéshez. A link 1 óra múlva lejár.`,
  ecConfirmBtn: "Új e-mail megerősítése",
  ecConfirmIgnore: "Ha nem te kérted ezt, nyugodtan hagyd figyelmen kívül.",
  ecNoticeSubject: "Phantom Tracker e-mail-csere kérés érkezett",
  ecNoticeHeading: "E-mail-csere kérés",
  ecNoticeHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  ecNoticeLine: (e) => `Kérés érkezett a fiókod e-mail-címének erre változtatására: ${e}. Csak akkor lép életbe, ha megerősíted az új címről.`,
  ecNoticeWarn: "Ha ez nem te voltál, azonnal változtasd meg a jelszavad.",
  disabledSubject: "A Phantom Tracker fiókod letiltásra került",
  disabledHeading: "Fiók letiltva",
  disabledHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  disabledLine: "A fiókod letiltásra került. Az emlékeztetők szünetelnek és az alkalmazás zárolva van, de minden adatod biztonságban marad. Jelentkezz be bármikor az azonnali újraaktiváláshoz.",
  disabledBtn: "Fiók újraaktiválása",
  delSubject: "A Phantom Tracker fiókod törlésre van ütemezve",
  delHeading: "Fiók törlésre ütemezve",
  delHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  delLine1: (d, w) => `A fiókod végleges törlésre van ütemezve. ${d} nap türelmi időd van, így bármikor meggondolhatod magad ${w} előtt, és minden visszaáll.`,
  delLine2: (w) => `${w} után a fiókod és minden kapcsolódó adat véglegesen törlődik, és nem állítható helyre.`,
  delBtn: "Fiók megtartása",
  reactSubject: "A Phantom Tracker fiókod újra aktív 👻",
  reactHeading: "Újra itt vagy!",
  reactHi: (n) => (n ? `Üdv újra, ${n}! 🎉` : "Üdv újra! 🎉"),
  reactLine: "A fiókod újra aktiválva, és minden szokásod és előzményed érintetlen. A függőben lévő törlés visszavonva.",
  reactBtn: "Phantom Tracker megnyitása",
  fbAckSubject: "Megkaptuk az üzeneted. Phantom Tracker",
  fbAckHeading: "Köszönjük, hogy írtál",
  fbAckHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  fbAckLine: "Megkaptuk az üzeneted, és egy valódi ember a lehető leghamarabb válaszol rá. Itt egy másolat arról, amit küldtél:",
  fbAckYour: "Az üzeneted",
  fbAckClosing: "Köszönjük, hogy segítesz jobbá tenni a Phantom Trackert. 👻",
  wsSubject: "A heted összefoglalója. Phantom Tracker",
  wsHeading: "A heted összefoglalója",
  wsHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  wsIntro: "Így telt az elmúlt 7 napod:",
  wsCompletions: "Teljesítések",
  wsBestStreak: "Legjobb aktív streak",
  wsPerfectDays: "Tökéletes napok",
  wsClosing: "Csak így tovább: minden bejelölés számít. 👻",
  wsBtn: "Irányítópult megnyitása",
  trialSubject: (d) => `A Pro próbaidőszakod ${d} nap múlva lejár`,
  trialHeading: "Hamarosan lejár a Pro próbaidőszakod",
  trialHi: (n) => (n ? `Szia ${n},` : "Szia,"),
  trialLine: (d) => `Az ingyenes Pro próbaidőszakod ${d} nap múlva lejár. Tartsd meg a korlátlan szokásokat, emlékeztetőket és haladó statisztikákat a Pro-val: vagy ne tegyél semmit, és egyszerűen átkerülsz az ingyenes csomagra.`,
  trialBtn: "Csomag kezelése",
};

const ro: EmailStrings = {
  verifySubject: (c) => `${c} este codul tău de verificare Phantom Tracker`,
  verifyHeading: "Verifică-ți adresa de e-mail",
  verifyIntro: "Introdu acest cod din 6 cifre pentru a finaliza înregistrarea. Expiră în 15 minute.",
  verifyIgnore: "Dacă nu ai creat un cont, poți ignora acest e-mail.",
  welcomeSubject: "Bun venit la Phantom Tracker 👻",
  welcomeHeading: "Bun venit la Phantom Tracker",
  welcomeHi: (n) => (n ? `Salut ${n}, contul tău e verificat și ești înăuntru! 🎉` : "Salut, contul tău e verificat și ești înăuntru! 🎉"),
  welcomeLine: "Creează primul obicei, bifează-l zilnic și privește cum cresc seriile, nivelurile și scorul tău Phantom. Setează mementouri ca să nu ratezi nicio zi.",
  welcomeBtn: "Deschide Phantom Tracker",
  resetSubject: "Resetează-ți parola Phantom Tracker",
  resetHeading: "Resetează-ți parola",
  resetHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  resetLine: "Am primit o cerere de resetare a parolei. Apasă butonul pentru a alege una nouă. Acest link expiră în 1 oră.",
  resetBtn: "Resetează parola",
  resetIgnore: "Dacă nu ai cerut asta, ignoră acest e-mail și parola rămâne aceeași.",
  twoFASubject: (c) => `${c} este codul tău de conectare Phantom Tracker`,
  twoFAHeading: "Codul tău de conectare",
  twoFAHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  twoFALine: "Introdu acest cod pentru a finaliza conectarea. Expiră în 10 minute.",
  twoFAIgnore: "Dacă nu ai încercat să te conectezi, schimbă-ți parola imediat.",
  ecConfirmSubject: "Confirmă noua ta adresă de e-mail Phantom Tracker",
  ecConfirmHeading: "Confirmă noua adresă de e-mail",
  ecConfirmHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  ecConfirmLine: (e) => `Ai cerut schimbarea e-mailului Phantom Tracker în ${e}. Apasă butonul pentru a confirma. Linkul expiră în 1 oră.`,
  ecConfirmBtn: "Confirmă noul e-mail",
  ecConfirmIgnore: "Dacă nu ai cerut asta, poți ignora acest e-mail.",
  ecNoticeSubject: "S-a cerut o schimbare de e-mail Phantom Tracker",
  ecNoticeHeading: "Schimbare de e-mail cerută",
  ecNoticeHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  ecNoticeLine: (e) => `S-a făcut o cerere de schimbare a e-mailului contului în ${e}. Are efect doar după confirmarea de la noua adresă.`,
  ecNoticeWarn: "Dacă nu ai fost tu, schimbă-ți parola imediat.",
  disabledSubject: "Contul tău Phantom Tracker a fost dezactivat",
  disabledHeading: "Cont dezactivat",
  disabledHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  disabledLine: "Contul tău a fost dezactivat. Mementourile sunt oprite și aplicația e blocată, dar toate datele tale sunt în siguranță. Conectează-te oricând pentru a reactiva instant.",
  disabledBtn: "Reactivează contul",
  delSubject: "Contul tău Phantom Tracker e programat pentru ștergere",
  delHeading: "Cont programat pentru ștergere",
  delHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  delLine1: (d, w) => `Contul tău e programat pentru ștergere definitivă. Ai o perioadă de grație de ${d} zile, așa că te poți răzgândi oricând înainte de ${w} și totul e restaurat.`,
  delLine2: (w) => `După ${w}, contul tău și toate datele asociate vor fi șterse definitiv și nu pot fi recuperate.`,
  delBtn: "Păstrează contul",
  reactSubject: "Contul tău Phantom Tracker este din nou activ 👻",
  reactHeading: "Te-ai întors!",
  reactHi: (n) => (n ? `Bine ai revenit, ${n}! 🎉` : "Bine ai revenit! 🎉"),
  reactLine: "Contul tău a fost reactivat și toate obiceiurile și istoricul tău sunt intacte. Orice ștergere în așteptare a fost anulată.",
  reactBtn: "Deschide Phantom Tracker",
  fbAckSubject: "Am primit mesajul tău. Phantom Tracker",
  fbAckHeading: "Mulțumim că ne-ai scris",
  fbAckHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  fbAckLine: "Am primit mesajul tău și un om îți va răspunde cât de curând posibil. Iată o copie a ceea ce ai trimis:",
  fbAckYour: "Mesajul tău",
  fbAckClosing: "Mulțumim că ne ajuți să facem Phantom Tracker mai bun. 👻",
  wsSubject: "Săptămâna ta pe scurt. Phantom Tracker",
  wsHeading: "Săptămâna ta pe scurt",
  wsHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  wsIntro: "Iată cum au decurs ultimele 7 zile:",
  wsCompletions: "Finalizări",
  wsBestStreak: "Cea mai bună serie activă",
  wsPerfectDays: "Zile perfecte",
  wsClosing: "Continuă tot așa: fiecare bifare contează. 👻",
  wsBtn: "Deschide panoul",
  trialSubject: (d) => `Perioada ta de probă Pro se încheie în ${d} ${d === 1 ? "zi" : "zile"}`,
  trialHeading: "Perioada ta de probă Pro se încheie curând",
  trialHi: (n) => (n ? `Salut ${n},` : "Salut,"),
  trialLine: (d) => `Perioada ta gratuită de probă Pro se încheie în ${d} ${d === 1 ? "zi" : "zile"}. Păstrează obiceiurile nelimitate, mementourile și statisticile avansate rămânând pe Pro: sau nu face nimic și vei trece pur și simplu la planul gratuit.`,
  trialBtn: "Gestionează planul",
};

const TABLE: Record<Locale, EmailStrings> = { en, hu, ro };

export function emailStrings(lang?: string | null): EmailStrings {
  return TABLE[isLocale(lang) ? lang : DEFAULT_LOCALE];
}
