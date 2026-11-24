import React from 'react';
import { motion } from 'framer-motion';

export interface TimelineContentProps {
  children: React.ReactNode;
  animationNum: number;
  timelineRef?: React.RefObject<any>;
  customVariants?: any;
  className?: string;
  as?: any;
}

export const TimelineContent = ({
  children,
  animationNum,
  timelineRef,
  customVariants,
  className,
  as: Component = "div"
}: TimelineContentProps) => {
  const MotionComponent = motion(Component as any);
  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, root: timelineRef }}
      variants={customVariants}
      custom={animationNum}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};
