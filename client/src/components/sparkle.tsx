import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type SparkleProps = {
  color?: string;
};

type SparkleInstance = {
  id: number;
  createdAt: number;
  color: string;
  size: number;
  style: {
    top: string;
    left: string;
  };
};

const DEFAULT_COLOR = "hsl(50, 100%, 50%)"; // Golden yellow
const generateSparkle = (color: string = DEFAULT_COLOR): SparkleInstance => {
  return {
    id: Math.random(),
    createdAt: Date.now(),
    color,
    size: Math.random() * 10 + 10,
    style: {
      // Random position around the center
      top: Math.random() * 100 - 50 + '%',
      left: Math.random() * 100 - 50 + '%',
    },
  };
};

const range = (start: number, end: number, step = 1) => {
  let output = [];
  for (let i = start; i < end; i += step) {
    output.push(i);
  }
  return output;
};

const SPARKLE_COUNT = 4;

export const Sparkles = ({ color = DEFAULT_COLOR }: SparkleProps) => {
  const [sparkles, setSparkles] = useState<SparkleInstance[]>(() => {
    return range(0, SPARKLE_COUNT).map(() => generateSparkle(color));
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSparkles([]);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <span className="absolute inset-0 pointer-events-none">
      {sparkles.map(sparkle => (
        <motion.span
          key={sparkle.id}
          className="absolute inline-block"
          initial={{ scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            scale: 1,
            rotate: 180,
            opacity: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          style={{
            ...sparkle.style,
            position: 'absolute',
          }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={sparkle.color}
            />
          </svg>
        </motion.span>
      ))}
    </span>
  );
};
