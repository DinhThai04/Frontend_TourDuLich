import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Container: React.FC<ContainerProps> = ({ children, style, className }) => {
  return (
    <div
      className={`${className} w-[1280px] my-[0px] !mx-auto max-w-full`}
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Container;
