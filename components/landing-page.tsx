import { ComparisonTable } from "@/components/comparison-table";
import { ArrowGlyph } from "@/components/landing/glyphs";
import { Apps } from "@/components/landing/apps";
import { DownloadCta } from "@/components/landing/download-cta";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Modes } from "@/components/landing/modes";
import { Privacy } from "@/components/landing/privacy";
import { Translate } from "@/components/landing/translate";
import { Pricing } from "@/components/pricing";
import { SiteFrame } from "@/components/site-frame";
import type { Locale } from "@/lib/content";
import { landingCopy } from "@/lib/content";
import { defaults as pageDefaults } from "@/lib/page-metadata";
import { publicReleaseCapabilities } from "@/lib/public-release-capabilities";
import { getWindowsRelease } from "@/lib/release";
import { visitorPlatform } from "@/lib/visitor-platform";

export async function LandingPage({ locale }: { locale: Locale }) {
  const release = publicReleaseCapabilities();
  const [windows, platform] = await Promise.all([getWindowsRelease(), visitorPlatform()]);
  // Windows is only mentioned as available once a release ships its installers.
  const windowsAvailable = windows !== null;
  const text = landingCopy(locale, {
    windowsAvailable,
    remoteRoutesPublished: release.byokValidated || release.pressayCloudValidated,
  });
  const offers = [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR" },
    ...(release.commercialOfferReady
      ? [
          { "@type": "Offer", name: "Pro monthly", price: "7.99", priceCurrency: "EUR" },
          { "@type": "Offer", name: "Pro annual", price: "69", priceCurrency: "EUR" },
        ]
      : []),
  ];
  return (
    <SiteFrame locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Pressay",
            description: pageDefaults[locale].description,
            inLanguage: locale,
            applicationCategory: "ProductivityApplication",
            operatingSystem: windowsAvailable ? "macOS 14 or later, Windows 10, Windows 11" : "macOS 14 or later",
            url: `https://press-say.app/${locale}`,
            downloadUrl: `https://press-say.app/${locale}/download`,
            offers,
          }).replaceAll("<", "\\u003c"),
        }}
      />
      <main id="main" className="landing">
        <Hero locale={locale} text={text.hero} platform={platform} windowsAvailable={windowsAvailable} />
        <HowItWorks locale={locale} text={text.how} />
        <Translate locale={locale} text={text.translate} />
        <Modes locale={locale} text={text.modes} />
        <Privacy locale={locale} text={text.privacy} routes={release.processingRoutes} />
        <Apps locale={locale} text={text.apps} windowsAvailable={windowsAvailable} />
        <section className="section" id="compare" aria-labelledby="compare-title">
          <div className="shell">
            <div className="section-head">
              <h2 id="compare-title">{text.compare.title}</h2>
              <p>{text.compare.body}</p>
            </div>
            <ComparisonTable locale={locale} />
          </div>
        </section>
        <section className="section" id="pricing" aria-labelledby="pricing-title">
          <div className="shell">
            <div className="section-head">
              <h2 id="pricing-title">{text.pricing.title}</h2>
              <p>{text.pricing.body}</p>
            </div>
            <Pricing locale={locale} />
            <p className="pricing-more">
              <a className="text-arrow" href={`/${locale}/pricing`}>{text.pricing.link}<ArrowGlyph /></a>
            </p>
          </div>
        </section>
        <Faq text={text.faq} />
        <DownloadCta locale={locale} text={text.cta} platform={platform} windowsAvailable={windowsAvailable} />
      </main>
    </SiteFrame>
  );
}
