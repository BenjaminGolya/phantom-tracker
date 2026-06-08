import { cookies } from "next/headers";
import { PhantomLoader } from "@/components/brand/phantom-loader";
import { translate } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

export default function Loading() {
  const raw = cookies().get(LANG_COOKIE)?.value;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return <PhantomLoader fullscreen label={translate(lang, "common.loading")} />;
}
