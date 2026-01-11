"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "narrow";
  background?: "default" | "surface";
}

export function Section({
  id,
  children,
  className,
  maxWidth = "default",
  background = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-12 md:py-20 lg:py-28",
        background === "surface" && "bg-surface rounded-lg border border-border mx-4 md:mx-6",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "container mx-auto px-4 md:px-6 lg:px-8",
          maxWidth === "narrow" && "max-w-[880px]"
        )}
      >
        {children}
      </motion.div>
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-4 md:mb-6 tracking-tight text-center">
      {children}
    </h2>
  );
}

export function SectionGrid({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 md:gap-8 lg:gap-12",
        columns === 2 && "md:grid-cols-2"
      )}
    >
      {children}
    </div>
  );
}
