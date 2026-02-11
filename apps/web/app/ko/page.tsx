import { KoreanHeroSection } from "@/components/KoreanHeroSection";
import { Section, SectionTitle } from "@/components/Section";
import { Footer } from "@/components/Footer";
import { QuestionButton } from "@/components/QuestionButton";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import type { Metadata } from "next";

const shortaLogo = "/shorta-logo.png";

export const metadata: Metadata = {
  title: "유튜브 쇼츠 스토리보드 생성기 | 촬영 전 기획 | Shorta",
  description:
    "유튜브 쇼츠를 위한 비트별 스토리보드를 생성하세요. 훅, 페이싱, 구조를 촬영 전에 계획하세요. 무료 분석기 포함 — 로그인 불필요.",
  keywords: [
    "유튜브 쇼츠 조회수 안나오는 이유",
    "유튜브 쇼츠 분석",
    "유튜브 쇼츠 이탈률 개선",
    "유튜브 쇼츠 스토리보드",
    "유튜브 쇼츠 훅",
    "쇼츠 분석기",
    "유튜브 쇼츠 스크립트",
    "AI 스토리보드 생성기",
    "유튜브 쇼츠 편집",
    "유튜브 쇼츠 조회수 늘리기",
  ],
  openGraph: {
    title: "유튜브 쇼츠 스토리보드 생성기 | 촬영 전 기획",
    description:
      "유튜브 쇼츠를 위한 비트별 스토리보드를 생성하세요. 훅, 페이싱, 구조를 촬영 전에 계획하세요. 무료 분석기 포함.",
    type: "website",
    locale: "ko_KR",
    url: "https://shorta.ai/ko",
    siteName: "Shorta - 스토리보드 생성기",
    images: [
      {
        url: "https://shorta.ai/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Shorta - 유튜브 쇼츠 분석 도구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "유튜브 쇼츠 스토리보드 생성기 | 촬영 전 기획",
    description:
      "유튜브 쇼츠를 위한 비트별 스토리보드를 생성하세요. 훅, 페이싱, 구조를 촬영 전에 계획하세요. 무료 분석기 포함.",
    site: "@eguitarz",
    creator: "@eguitarz",
    images: ["https://shorta.ai/og-image.svg"],
  },
  alternates: {
    canonical: "https://shorta.ai/ko",
    languages: {
      en: "https://shorta.ai",
      ko: "https://shorta.ai/ko",
    },
  },
};

export default function KoreanHomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-4 pb-3 md:pt-6 md:pb-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={shortaLogo} alt="Shorta" className="h-12 w-12 md:h-16 md:w-16" />
              <span className="text-lg md:text-2xl font-semibold text-foreground">Shorta AI</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href="/ko/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                요금제
              </a>
              <a
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                로그인
              </a>
              <a
                href="/try"
                className="bg-primary text-primary-foreground px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 text-sm md:text-base"
              >
                무료 체험
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Hero */}
      <KoreanHeroSection />

      {/* 2. How It Works — 3 steps */}
      <Section id="how-it-works" maxWidth="narrow">
        <SectionTitle>사용 방법</SectionTitle>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">1</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">URL 붙여넣기 또는 업로드</h3>
            <p className="text-muted-foreground text-sm">
              유튜브 쇼츠 링크를 넣거나 영상 파일을 업로드하세요. 초안이나 러프컷도 가능합니다.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">2</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">비트별 분석 받기</h3>
            <p className="text-muted-foreground text-sm">
              AI가 매 초를 분석합니다 — 훅 점수, 이탈 구간, 페이싱 문제, 명확성 진단까지.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">3</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">수정하고 다시 촬영</h3>
            <p className="text-muted-foreground text-sm">
              제안된 수정 사항을 반영하고 새 스토리보드를 생성하세요 — 문제가 해결된 상태로 바로 촬영 가능합니다.
            </p>
          </div>
        </div>
      </Section>

      {/* 3. Product Demo */}
      <Section id="features" maxWidth="narrow">
        <SectionTitle>Shorta가 하는 일</SectionTitle>

        {/* Analyzer */}
        <div className="mb-16 md:mb-20">
          <div className="mb-4">
            <span className="text-xs font-mono text-violet-400 mb-2 block">분석</span>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              게시 전에 업로드하세요
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              분석기가 시청자처럼 쇼츠를 시청한 뒤 — 어디서 흥미를 잃는지, 왜 그런지 정확히 알려줍니다.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                대안이 포함된 훅 점수
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                이탈률 타임라인
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                타임스탬프별 수정 제안
              </li>
            </ul>
          </div>
          <div className="aspect-video bg-surface rounded-xl border border-border overflow-hidden shadow-lg">
            <video
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="object-cover w-full h-full"
            >
              <source src="/analyzer.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Storyboard */}
        <div>
          <div className="mb-4">
            <span className="text-xs font-mono text-primary mb-2 block">생성</span>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              아이디어를 촬영 가능한 스토리보드로
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              아이디어를 설명하면 AI가 훅, 페이싱, 연출 노트가 포함된 비트별 제작 계획을 만들어 줍니다. 몇 분 안에 촬영 준비 완료.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                타이밍이 포함된 비트별 스크립트
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                연출 노트
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                다양한 훅 옵션
              </li>
            </ul>
          </div>
          <div className="aspect-video bg-surface rounded-xl border border-border overflow-hidden shadow-lg">
            <video
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="object-cover w-full h-full"
            >
              <source src="/storyboard-compressed.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* YouTube Connect */}
        <div className="mt-16 md:mt-20">
          <div className="mb-4">
            <span className="text-xs font-mono text-emerald-400 mb-2 block">연결</span>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              채널의 실제 성과를 추적하세요
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              유튜브 채널을 연결하고 실제로 무엇이 효과가 있는지 확인하세요. 이탈률 곡선, 니치 포지셔닝, 성장 추세 — 모두 하나의 대시보드에서.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">→</span>
                모든 쇼츠의 이탈률 곡선
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">→</span>
                니치 및 수익화 인사이트
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">→</span>
                구독자 성장 추적
              </li>
            </ul>
          </div>
          <div className="aspect-video bg-surface rounded-xl border border-border overflow-hidden shadow-lg p-6 md:p-8 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814Z" /><path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136Z" fill="white" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">채널 대시보드</p>
                <p className="text-xs text-muted-foreground">유튜브 연결됨</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              <div className="bg-background/60 rounded-lg p-3 border border-border/40">
                <p className="text-xs text-muted-foreground mb-1">평균 이탈률</p>
                <p className="text-lg md:text-xl font-bold text-emerald-400">72%</p>
              </div>
              <div className="bg-background/60 rounded-lg p-3 border border-border/40">
                <p className="text-xs text-muted-foreground mb-1">상위 니치</p>
                <p className="text-lg md:text-xl font-bold text-foreground">Tech</p>
              </div>
              <div className="bg-background/60 rounded-lg p-3 border border-border/40">
                <p className="text-xs text-muted-foreground mb-1">성장</p>
                <p className="text-lg md:text-xl font-bold text-emerald-400">+18%</p>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-1.5">
              {[35, 42, 38, 55, 48, 62, 58, 70, 65, 74, 68, 78, 72, 80, 76, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500/30 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <a href="/try">
            <Button variant="hero" size="lg">
              무료 체험 — 로그인 불필요
            </Button>
          </a>
        </div>
      </Section>

      {/* 4. Who It's For */}
      <Section id="who" maxWidth="narrow">
        <SectionTitle>성장하고 싶은 크리에이터를 위해</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">유튜브 초보자</p>
            <p className="text-sm text-muted-foreground">
              왜 쇼츠 조회수가 50뷰에 머무는지 모르겠나요? 분석기가 훅, 페이싱, 구성에서 정확히 무엇을 고쳐야 하는지 보여줍니다.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">조회수 정체 중인 크리에이터</p>
            <p className="text-sm text-muted-foreground">
              꾸준히 업로드하지만 돌파구가 없나요. Shorta가 당신을 붙잡고 있는 패턴을 찾아냅니다.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">혼자 활동하는 크리에이터</p>
            <p className="text-sm text-muted-foreground">
              편집자도, PD도, 피드백을 줄 사람도 없다면. Shorta가 당신에게 없는 두 번째 눈이 되어줍니다.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">촬영 전 기획하는 모든 분</p>
            <p className="text-sm text-muted-foreground">
              스토리보드 생성기가 촬영 가능한 계획을 만들어 줘서, 즉흥이 아닌 구조를 갖춘 촬영을 시작할 수 있습니다.
            </p>
          </div>
        </div>
      </Section>

      {/* 5. Social Proof */}
      <Section id="proof" maxWidth="narrow">
        <div className="bg-surface/50 rounded-xl p-6 md:p-8 border border-border/50">
          <div className="md:flex md:items-start md:gap-8">
            <div className="md:flex-1 mb-6 md:mb-0">
              <h3 className="text-lg font-semibold text-foreground mb-3">Shorta가 탄생한 이유</h3>
              <p className="text-muted-foreground text-sm mb-4">
                저는 Meta에서 AI로 개발자 생산성을 높이는 일을 했습니다. 유튜브 쇼츠를 만들기 시작하면서 같은 문제가 있다는 걸 깨달았죠 — 크리에이터들이 데이터 대신 감에 의존하며 시간을 낭비하고 있었습니다.
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Shorta는 제가 갖고 싶었던 도구입니다. 프로듀서처럼 쇼츠를 분석한 뒤, 문제를 수정한 더 나은 버전을 만들어 줍니다.
              </p>
              <p className="text-sm text-foreground font-medium">
                — Dale Ma, 창립자
              </p>
              <p className="text-xs text-muted-foreground">
                전 Meta 엔지니어 · Shorta 풀타임 개발 중
              </p>
            </div>
            <div className="md:flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-xs text-muted-foreground mt-1">쇼츠당 분석 차원</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">60초</p>
                  <p className="text-xs text-muted-foreground mt-1">평균 분석 시간</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">무료</p>
                  <p className="text-xs text-muted-foreground mt-1">첫 분석, 로그인 불필요</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">AI</p>
                  <p className="text-xs text-muted-foreground mt-1">연출 수준 스토리보드</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. Pricing */}
      <Section id="pricing" maxWidth="narrow">
        <SectionTitle>심플한 요금제</SectionTitle>
        <p className="text-center text-muted-foreground mb-8 md:mb-10">
          먼저 무료로 체험하세요. 준비되면 업그레이드.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Hobby */}
          <div className="bg-surface/50 rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-bold text-foreground mb-1">Hobby</h3>
            <p className="text-sm text-muted-foreground mb-4">가벼운 창작에 적합</p>
            <p className="text-3xl font-bold text-foreground mb-1">$6<span className="text-lg font-normal text-muted-foreground">/월</span></p>
            <p className="text-xs text-muted-foreground mb-4">연간 결제 · 월간 $8/월</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>월 1,000 크레딧</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~10개 스토리보드</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>크레딧 이월 (최대 1.5배 한도)</span>
              </li>
            </ul>
            <a href="/ko/pricing" className="block">
              <Button variant="outline" size="lg" className="w-full">
                시작하기
              </Button>
            </a>
          </div>

          {/* Pro */}
          <div className="bg-surface/50 rounded-xl p-6 border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
              인기
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">주간 크리에이터에 적합</p>
            <p className="text-3xl font-bold text-foreground mb-1">$15<span className="text-lg font-normal text-muted-foreground">/월</span></p>
            <p className="text-xs text-muted-foreground mb-4">연간 결제 · 월간 $18/월</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>월 3,500 크레딧</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~35개 스토리보드</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>크레딧 이월 (최대 1.5배 한도)</span>
              </li>
            </ul>
            <a href="/ko/pricing" className="block">
              <Button variant="hero" size="lg" className="w-full">
                시작하기
              </Button>
            </a>
            <TrustBadges />
          </div>

          {/* Producer */}
          <div className="bg-surface/50 rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-bold text-foreground mb-1">Producer</h3>
            <p className="text-sm text-muted-foreground mb-4">일일 크리에이터 및 팀에 적합</p>
            <p className="text-3xl font-bold text-foreground mb-1">$45<span className="text-lg font-normal text-muted-foreground">/월</span></p>
            <p className="text-xs text-muted-foreground mb-4">연간 결제 · 월간 $56/월</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>월 12,000 크레딧</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~120개 스토리보드</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>피드백 우선 처리</span>
              </li>
            </ul>
            <a href="/ko/pricing" className="block">
              <Button variant="outline" size="lg" className="w-full">
                시작하기
              </Button>
            </a>
          </div>
        </div>

        {/* Waitlist */}
        <div className="max-w-sm mx-auto mt-8 bg-surface/30 p-5 rounded-xl border border-border/30">
          <p className="text-sm text-muted-foreground text-center mb-3">아직 준비가 안 됐나요? 출시 알림을 받으세요.</p>
          <WaitlistForm />
        </div>
      </Section>

      {/* 7. FAQ */}
      <Section id="faq" maxWidth="narrow">
        <SectionTitle>유튜브 쇼츠 FAQ</SectionTitle>
        <div className="space-y-6 md:space-y-8">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">유튜브 쇼츠 조회수가 안 나오는 이유는?</h3>
            <p className="text-base text-muted-foreground">
              대부분의 쇼츠는 처음 2초 안에 실패합니다 — 약한 훅, 느린 페이싱, 불명확한 가치 전달. 유튜브 알고리즘은 이탈률을 측정하며, 시청자가 일찍 넘기면 더 많은 사람에게 노출되지 않습니다. Shorta의 분석기는 시청자가 어디서 이탈하는지, 왜 그런지 정확히 보여줘서 게시 전에 문제를 수정할 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">유튜브 쇼츠 이탈률을 개선하는 방법은?</h3>
            <p className="text-base text-muted-foreground">
              훅(처음 1-2초)에 집중하고, 빠른 페이싱을 유지하며, 가치를 빠르게 전달하세요. Shorta는 영상을 비트별로 분석하고 느린 인트로, 약한 전환, 불명확한 메시지 같은 이탈 요인을 찾아내어 — 구체적인 수정 방법을 제안합니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">AI 스토리보드 생성기는 어떻게 작동하나요?</h3>
            <p className="text-base text-muted-foreground">
              영상 아이디어를 설명하세요 — 주제, 형식, 목표 길이. AI가 훅, 콘텐츠 흐름, 페이싱, CTA가 포함된 비트별 스토리보드를 만듭니다. 각 비트에는 카메라 앵글, 에너지, 전달 방식에 대한 연출 노트가 포함됩니다. 단순한 스크립트가 아닌 촬영 가능한 계획입니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">유튜브 쇼츠를 무료로 분석할 수 있나요?</h3>
            <p className="text-base text-muted-foreground">
              네. Shorta는 무료 분석을 제공합니다 — 신용카드도, 로그인도 필요 없습니다. 영상을 업로드하면 훅, 페이싱, 이탈률에 대한 AI 기반 피드백을 즉시 받을 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">영상 스크립트에 ChatGPT보다 나은가요?</h3>
            <p className="text-base text-muted-foreground">
              ChatGPT는 오래된 학습 데이터로 일반적인 스크립트를 줍니다. Shorta는 타이밍이 정해진 비트, 훅 옵션, 연출 노트가 포함된 제작 수준의 스토리보드를 만듭니다 — 유튜브 쇼츠 이탈률에 최적화되어 있습니다. 텍스트 덩어리와 촬영 설계도의 차이입니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">유튜브 영상 분석기는 무엇을 확인하나요?</h3>
            <p className="text-base text-muted-foreground">
              분석기는 네 가지 차원을 확인합니다: 훅 강도(처음 1-2초), 콘텐츠 구조, 페이싱과 전달, 전체적인 명확성. 발견된 모든 문제에는 타임스탬프가 포함된 수정 방법이 함께 제공되어 정확히 무엇을 바꿔야 하는지 알 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-8 md:mt-10">
          <a href="/try">
            <Button variant="hero" size="lg">
              무료 체험 — 직접 확인하세요
            </Button>
          </a>
        </div>
      </Section>

      {/* Footer */}
      <Footer
        items={[
          { text: "\u00A9 Shorta", variant: "muted" },
          { text: "Tools", href: "/tools" },
          { text: "Blog", href: "/blog" },
          { text: "요금제", href: "/ko/pricing" },
          { text: "Privacy", href: "/privacy" },
          { text: "Terms", href: "/terms" },
          { text: "Contact", href: "mailto:support@shorta.ai" },
        ]}
      />

      {/* Fixed Question Button */}
      <QuestionButton />
    </div>
  );
}
