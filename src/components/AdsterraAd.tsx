import React, { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  adKey?: string;
  width?: number;
  height?: number;
}

const AdsterraAd: React.FC<AdsterraAdProps> = ({ 
  adKey = "48fc53489149f9fac60634e87fd9f134", 
  width = 160, 
  height = 300 
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
      
      adRef.current.appendChild(script);
      adRef.current.appendChild(invokeScript);
    }
  }, [adKey, width, height]);

  return (
    <div 
      ref={adRef} 
      className="flex justify-center items-center overflow-hidden bg-zinc-900/50 rounded-lg"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

export default AdsterraAd;
