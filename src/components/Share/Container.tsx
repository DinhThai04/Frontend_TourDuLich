import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Container: React.FC<ContainerProps> = ({ children, style, className = '' }) => {
  return (
    <div
      className={`site-container w-full max-w-[1240px] mx-auto px-4 md:px-6 ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
};

export default Container;
