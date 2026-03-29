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
  return (
    <div className={`w-full flex justify-center my-8 overflow-hidden ${className}`}>
      <iframe
        src={`/ad.html?key=${adKey}&width=${width}&height=${height}`}
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
