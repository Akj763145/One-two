import { useEffect, useRef } from 'react';

export default function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous content to prevent duplicates on re-renders
    containerRef.current.innerHTML = '';
    
    // 1. Create the target div required by Adsterra
    const adDiv = document.createElement('div');
    adDiv.id = 'container-b95d3413c778940adc31e43de1fb52de';
    containerRef.current.appendChild(adDiv);

    // 2. Create and append the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = '//pl28944897.profitablecpmratenetwork.com/b95d3413c778940adc31e43de1fb52de/invoke.js';
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full flex justify-center my-8 overflow-hidden min-h-[100px]">
      <div ref={containerRef} className="w-full max-w-4xl flex justify-center"></div>
    </div>
  );
}
