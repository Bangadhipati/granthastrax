import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { HeroBackground } from "@/components/layout/HeroBackground";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border">
      <HeroBackground />
      
      {/* Content Container */}
      <motion.div 
        className="relative mx-auto max-w-7xl px-6 pb-14 pt-32 sm:pb-24 sm:pt-40"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="text-[11px] uppercase tracking-[0.32em] text-gold">
          A studio for serious work
        </motion.p>
        
        <motion.h1 variants={itemVariants} className="mt-4 max-w-3xl text-4xl leading-[1.1] sm:text-6xl">
          Everything a researcher and author needs,{" "}
          <span className="text-gold-gradient">in one quiet workspace.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          GranthAstraX replaces the tab-sprawl of converters, compressors, LaTeX editors and
          print calculators with four precise desks — designed for focus, not noise.
        </motion.p>
        
        <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/research"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            Open Research Desk <ArrowUpRight className="size-4" />
          </Link>
          <Link
            to="/writer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold bg-background/50 backdrop-blur-sm"
          >
            Design a book
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
