import React, { useEffect, useRef } from 'react';

const AdsterraNativeBanner: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = "//www.highperformanceformat.com/48fc53489149f9fac60634e87fd9f134/invoke.js";
      
      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      ref={adRef} 
      className="w-full min-h-[250px] bg-zinc-900/50 rounded-xl overflow-hidden flex items-center justify-center"
      id="container-48fc53489149f9fac60634e87fd9f134"
    />
  );
};

export default AdsterraNativeBanner;
