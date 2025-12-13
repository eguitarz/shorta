import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function QuestionButton() {
  const handleClick = () => {
    // Placeholder action - could open a chat widget, modal, or mailto link
    window.location.href = "mailto:support@shorta.ai?subject=Question about Shorta";
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
