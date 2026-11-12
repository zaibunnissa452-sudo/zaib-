import { motion } from "framer-motion";

interface KineticTextProps {
  heading: string;
  emphasis: string;
  className?: string;
}

export function KineticText({ heading, emphasis, className = "" }: KineticTextProps) {
  const words = heading.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 22, rotateX: 20 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.h1
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      <span className="block">
        {words.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            variants={wordVariants}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </span>
      <motion.em
        variants={wordVariants}
        className="block bg-gradient-to-r from-[#f0c66a] via-[#fff2c6] to-[#e9b957] bg-clip-text text-transparent italic"
        style={{
          backgroundSize: "200% auto",
          animation: "goldShimmer 6s linear infinite",
        }}
      >
        {emphasis}
      </motion.em>
    </motion.h1>
  );
}
