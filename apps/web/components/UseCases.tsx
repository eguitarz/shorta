"use client";

import { Card } from "@/components/Card";

interface UseCase {
  name: string;
  persona: string;
  photo: string;
  problem: string[];
  howShortaHelps: string[];
  outcome: string;
  metric: string;
  testimonial: string;
}

const useCases: UseCase[] = [
  {
    name: "Faye",
    persona: "Life coach expanding into YouTube Shorts",
    photo: "/faye.jpg",
    problem: [
      "Inconsistent Shorts quality",
      "Went viral occasionally, but couldn't repeat it"
    ],
    howShortaHelps: [
      "Analyzes her hook & delivery patterns",
      "Stabilizes quality across uploads",
      "Turns \"lucky viral\" into repeatable structure"
    ],
    outcome: "Went viral once a week, consistently — without changing her voice.",
    metric: "Average views: 3K → 18K per Short",
    testimonial: "I was throwing content at the wall hoping something stuck. Now I actually know what works before I film. My clients kept asking how I grew so fast!"
  },
  {
    name: "Jason",
    persona: "AI tools YouTuber, software engineer",
    photo: "/jason.jpg",
    problem: [
      "Knows the content, lacks confidence on camera",
      "Unsure if ideas will work as Shorts"
    ],
    howShortaHelps: [
      "Converts raw knowledge into viral-ready storyboards",
      "Provides execution details (hook angle, pacing, framing)",
      "Removes uncertainty before hitting record"
    ],
    outcome: "Confidence to press record.",
    metric: "Retention rate: 38% → 61% after first revision",
    testimonial: "Being on camera still makes me nervous, but at least now I know exactly what to say and when. It's like having a script that doesn't feel like a script. I deleted way fewer takes."
  },
  {
    name: "Victor",
    persona: "Startup CEO running UGC ads",
    photo: "/victor.jpg",
    problem: [
      "Slow iteration with creators",
      "Hard to explain what's wrong in ad scripts"
    ],
    howShortaHelps: [
      "Fast iteration on ad creatives",
      "Analyzer flags issues before launch",
      "Clear, shared feedback language with UGC creators"
    ],
    outcome: "Fewer mistakes. Faster ad iteration. Better creator collaboration.",
    metric: "Ad CTR: 1.4% → 2.9% with fewer revisions",
    testimonial: "We were burning budget on ads that just... didn't hit. Now our creators get specific feedback instead of me saying 'make it more engaging.' Cut our revision cycles in half."
  }
];

export function UseCases() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {useCases.map((useCase) => (
        <Card key={useCase.name} title={`${useCase.name} — ${useCase.persona}`}>
          <div className="space-y-6">
            {/* Testimonial - Highlighted at top */}
            <div className="p-6 bg-primary/10 rounded-lg border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <img
                  src={useCase.photo}
                  alt={useCase.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-lg text-foreground italic leading-relaxed">
                    "{useCase.testimonial}"
                  </p>
                  <p className="text-sm text-muted-foreground mt-3 font-semibold">
                    — {useCase.name}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-foreground mb-3">Problem</h4>
              <ul className="space-y-2 text-lg text-muted-foreground">
                {useCase.problem.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-foreground mb-3">How Shorta helps</h4>
              <ul className="space-y-2 text-lg text-muted-foreground">
                {useCase.howShortaHelps.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                <p className="text-base font-bold text-green-600 dark:text-green-400">
                  {useCase.metric}
                </p>
              </div>
              <p className="text-lg font-medium text-foreground italic">
                {useCase.outcome}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
