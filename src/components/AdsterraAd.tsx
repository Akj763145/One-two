import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  adKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function AdsterraAd({ 
  adKey = 'YOUR_ADSTERRA_KEY', 
  width = 728, 
  height = 90,
  className = ''
}: AdsterraAdProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentWindow?.document;
    
    if (doc) {
      doc.open();
      // We use an iframe to safely isolate the ad script. 
      // Many ad networks use document.write(), which would wipe out a React SPA if executed directly.
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                background: transparent; 
                color: rgba(255,255,255,0.5);
                font-family: system-ui, sans-serif;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            ${adKey === 'YOUR_ADSTERRA_KEY' ? '<span>Adsterra Ad Placeholder</span>' : `
              <script type="text/javascript">
                atOptions = {
                  'key' : '${adKey}',
                  'format' : 'iframe',
                  'height' : ${height},
                  'width' : ${width},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/${adKey}/invoke.js"></script>
            `}
          </body>
        </html>
      `);
      doc.close();
    }
  }, [adKey, width, height]);

  return (
    <div className={`w-full flex justify-center my-8 overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        title="Advertisement"
        className="bg-white/5 border border-white/10 rounded-lg max-w-full"
      />
    </div>
  );
}
