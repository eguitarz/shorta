"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function KoreanHeroSection() {
  return (
    <section className="pt-6 pb-12 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl"
        >
          {/* H1 - benefit-driven */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-heading">
            시청자가 왜
            <br />
            <span className="text-primary">넘겨버리는지</span> 정확히 확인하세요
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mt-4 md:mt-6 max-w-2xl">
            AI 기반 유튜브 쇼츠 분석기 및 스토리보드 생성기. 훅, 페이싱, 이탈률에 대한 비트별 피드백을 받고 — 더 나은 버전을 생성하세요.
          </p>

          {/* Single CTA */}
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start gap-3">
            <a href="/try">
              <Button variant="hero" size="lg" className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
                무료 체험 — 내 쇼츠 분석하기
              </Button>
            </a>
            <p className="text-sm text-muted-foreground sm:self-center">
              로그인 불필요 · 카드 불필요 · 60초 안에 결과 확인
            </p>
          </div>
        </motion.div>

        {/* Product Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-10 md:mt-14 max-w-5xl"
        >
          <div className="rounded-xl border border-border overflow-hidden shadow-2xl shadow-primary/5">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full"
            >
              <source src="/LandingPage.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
