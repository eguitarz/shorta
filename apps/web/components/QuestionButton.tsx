"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function QuestionButton() {
  const handleClick = () => {
    const subject = "Question about Shorta Founding Membership";
    const body = `Hi Dale,

I have a question about Shorta:

[Write your question here]

Thanks!`;
    window.location.href = `mailto:support@shorta.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        variant="fab"
        size="fab"
        onClick={handleClick}
        className="group"
        aria-label="Ask a question"
      >
        <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
      </Button>
    </motion.div>
  );
}
