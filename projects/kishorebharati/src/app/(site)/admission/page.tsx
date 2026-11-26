import { FileCheck2 } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { admissionDocuments, admissionFees, admissionForm, admissionSteps, admissionTop, siteContact, siteCta } from '@/cms/sections';
import { AdmissionForm } from '@/components/site/forms';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head, Prose } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Cta } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, steps] = await Promise.all([getSite(), content(admissionTop), content(admissionSteps)]);
  return pageMeta({ lang, title: t.nav.admission, description: `${top.text} ${steps.items[0]?.text ?? ''}`, path: '/admission' });
}

export default async function AdmissionPage() {
  const { t } = await getSite();
  const [top, steps, documents, fees, form, contact, visit] = await Promise.all([
    content(admissionTop),
    content(admissionSteps),
    content(admissionDocuments),
    content(admissionFees),
    content(admissionForm),
    content(siteContact),
    content(siteCta),
  ]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.admission, path: '/admission' }]}>
        {!isHidden(form) ? (
          <div className="flex flex-wrap gap-3">
            <Cta href="#enquire" variant="red" arrow className="rounded-md">
              {form.heading}
            </Cta>
            <Cta href="/schemes" variant="outline" className="rounded-md">
              {t.nav.schemes}
            </Cta>
          </div>
        ) : null}
      </PageTop>

      {!isHidden(steps) && steps.items.length ? (
        <Band tone="paper">
          <Head index={1} heading={steps.heading} />
          <Stagger className="relative mt-10 grid gap-6 md:grid-cols-3">
            {steps.items.map((step, i) => (
              <StaggerItem key={i} className="relative rounded-xl border border-brand-950/10 bg-white p-7">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-950 text-lg font-bold text-sun-300">{i + 1}</span>
                <h3 className="mt-5 text-2xl font-bold text-brand-950">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{step.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          {steps.note ? <p className="mt-6 border-l-[3px] border-accent-600 pl-4 font-semibold text-ink-800">{steps.note}</p> : null}
        </Band>
      ) : null}

      <Band tone="white">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {!isHidden(documents) && documents.items.length ? (
            <div>
              <Head index={2} heading={documents.heading} />
              <Stagger className="mt-8 divide-y divide-brand-950/10 border-y border-brand-950/10">
                {documents.items.map((d, i) => (
                  <StaggerItem key={i} className="flex items-start gap-3 py-4">
                    <FileCheck2 aria-hidden size={20} className="mt-0.5 shrink-0 text-accent-600" />
                    <span className="text-[17px] text-ink-800">{d.text}</span>
                  </StaggerItem>
                ))}
              </Stagger>
              {documents.note ? <p className="mt-4 text-ink-600">{documents.note}</p> : null}
            </div>
          ) : null}
          {!isHidden(fees) ? (
            <div>
              <Head index={3} heading={fees.heading} />
              <Reveal delay={0.08}>
                <Prose text={fees.text} className="mt-8 text-ink-800" />
                {fees.items.length ? (
                  <table className="mt-6 w-full text-left">
                    <tbody>
                      {fees.items.map((row, i) => (
                        <tr key={i} className="border-b border-brand-950/10">
                          <th scope="row" className="py-3 pr-4 font-semibold text-brand-950">
                            {row.who}
                          </th>
                          <td className="tabular py-3 text-ink-800">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </Reveal>
            </div>
          ) : null}
        </div>
      </Band>

      {!isHidden(form) ? (
        <Band tone="deep" id="enquire" className="scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <Head index={4} heading={form.heading} text={form.text} />
            </div>
            <Reveal delay={0.08} className="rounded-xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(22,26,58,.6)] sm:p-9">
              <AdmissionForm copy={form} whatsapp={contact.whatsapp} whatsappMessage={visit.whatsappMessage} />
            </Reveal>
          </div>
        </Band>
      ) : null}
    </>
  );
}
