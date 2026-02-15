"use client";

import { Section, SectionTitle } from "@/components/Section";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const shortaLogo = "/shorta-logo.png";

export default function Privacy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6">
        <div className="container mx-auto px-2">
          <img
            src={shortaLogo}
            alt="Shorta"
            className="h-36 md:h-40 cursor-pointer"
            onClick={() => router.push("/")}
          />
        </div>
      </header>

      <Section maxWidth="narrow">
        <SectionTitle>Privacy Policy</SectionTitle>

        <div className="space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">Last updated: February 15, 2025</p>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Information We Collect</h3>
            <p>
              We collect information you provide directly to us, including your email address, payment information, and channel data you choose to share with Shorta.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">How We Use Your Information</h3>
            <p>
              We use your information to provide and improve our services, analyze viral content patterns, and generate personalized scripts for your YouTube Shorts.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Data Storage</h3>
            <p>
              We store summarized channel data (not raw videos) to help our AI generate content specifically tailored to your audience and style. Your data is never shared with third parties.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Google User Data</h3>
            <p>
              When you connect your YouTube account, we access the following data through Google APIs:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>YouTube channel information (channel name, thumbnail, subscriber count, video count)</li>
              <li>Video metadata (titles, descriptions, thumbnails, view counts, publish dates, duration)</li>
              <li>YouTube Analytics data (average view duration, audience retention)</li>
            </ul>
            <p className="mt-2">
              We do not access, store, or share your private YouTube videos, comments, or any data beyond what is described above. Our use of Google user data complies with the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Retention of Google User Data</h3>
            <p>
              We retain Google user data only for as long as necessary to provide our services to you:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>OAuth access tokens are encrypted (AES-256-GCM) and stored server-side only. They are refreshed automatically and the previous tokens are overwritten.</li>
              <li>Channel and video metadata is retained while your YouTube account remains connected to Shorta.</li>
              <li>Analytics data (view duration, retention curves) is retained while your account is active to power content recommendations.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Deletion of Google User Data</h3>
            <p>
              You can delete your Google user data at any time:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Disconnect YouTube:</strong> Use the &quot;Disconnect&quot; button in your dashboard settings. This immediately revokes our access tokens and deletes all stored YouTube channel data, video metadata, and analytics data from our servers.</li>
              <li><strong>Delete your account:</strong> Deleting your Shorta account will permanently remove all associated data, including any Google user data.</li>
              <li><strong>Revoke access via Google:</strong> You can also revoke Shorta&apos;s access at any time from your{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google Account permissions page
                </a>
                .
              </li>
              <li><strong>Request deletion:</strong> Contact us at{" "}
                <a href="mailto:support@shorta.ai" className="text-primary hover:underline">
                  support@shorta.ai
                </a>
                {" "}to request deletion of your Google user data. We will process your request within 30 days.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. OAuth tokens are encrypted using AES-256-GCM and stored server-side only. Tokens are never exposed to the client browser.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@shorta.ai" className="text-primary hover:underline">
                support@shorta.ai
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={() => router.push("/")} variant="outline">
            Return to Home
          </Button>
        </div>
      </Section>
    </div>
  );
}
