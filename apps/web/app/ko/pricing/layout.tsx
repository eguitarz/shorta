import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 – 유튜브 쇼츠 분석기 | Shorta",
  description:
    "Shorta 요금제: 무료 체험, Hobby $6/월, Pro $15/월, Producer $45/월. 유튜브 쇼츠를 분석하고, 스토리보드를 생성하고, 이탈률 문제를 게시 전에 수정하세요.",
  openGraph: {
    title: "요금제 – 유튜브 쇼츠 분석기 | Shorta",
    description:
      "Shorta 요금제: 무료 체험부터 Pro까지. 유튜브 쇼츠를 분석하고 이탈률 문제를 수정하세요.",
    url: "https://shorta.ai/ko/pricing",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://shorta.ai/ko/pricing",
    languages: {
      en: "https://shorta.ai/pricing",
      ko: "https://shorta.ai/ko/pricing",
    },
  },
};

export default function KoreanPricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
