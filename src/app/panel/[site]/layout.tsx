"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { t } from "@/nx/i18n";
import { ChangePasswordForm, LoginForm } from "@/nx/panel/login";
import { SiteProvider, useLangOnly } from "@/nx/panel/provider";
import { Notice, TopBar } from "@/nx/panel/ui";

function GoToDemoLogin({ site }: { site: string }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    router.replace(`/login/${site}?next=${encodeURIComponent(pathname || `/panel/${site}`)}`);
  }, [router, site, pathname]);
  return <p className="text-slate-500">...</p>;
}

export default function SiteLayout({ children, params }: { children: React.ReactNode; params: { site: string } }) {
  const [lang, setLang] = useLangOnly();
  const router = useRouter();
  return (
    <SiteProvider
      site={params.site}
      fallback={({ loading, storage, session, schema, needsDemoLogin }) => (
        <>
          <TopBar lang={lang} setLang={setLang} title={schema?.name ?? t(lang, "panelName")} back={schema?.url ?? `/demo/${params.site}`} />
          <main className="mx-auto max-w-3xl px-4 py-8">
            {!schema ? (
              <Notice tone="bad">
                Unknown website. <Link href="/demos" className="underline">{t(lang, "back")}</Link>
              </Notice>
            ) : loading ? (
              <p className="text-slate-500">...</p>
            ) : needsDemoLogin ? (
              <GoToDemoLogin site={params.site} />
            ) : storage === "neon" && !session ? (
              <LoginForm lang={lang} onDone={() => router.refresh()} />
            ) : storage === "neon" && session?.mustChangePassword ? (
              <ChangePasswordForm lang={lang} onDone={() => window.location.reload()} />
            ) : (
              <Notice tone="bad">{t(lang, "notAllowed")}</Notice>
            )}
          </main>
        </>
      )}
    >
      {children}
    </SiteProvider>
  );
}
