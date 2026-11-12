import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  onClick,
  href,
  type = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 });
  }

  const { x, y } = position;

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 220, damping: 16, mass: 0.2 }}
      className="inline-block"
    >
      {href ? (
        <a href={href} className={className} onClick={onClick}>
          {children}
        </a>
      ) : (
        <button type={type} className={className} onClick={onClick}>
          {children}
        </button>
      )}
    </motion.div>
  );

  return content;
}
