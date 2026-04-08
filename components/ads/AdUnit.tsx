'use client';

import React, { useEffect, useRef } from 'react';

type AdType = 'native' | '300x250' | '320x50';

interface AdUnitProps {
  type: AdType;
}

const AD_CONFIGS = {
  native: {
    id: 'container-a04663584ae11535d7fc5ddcfb2d6369',
    src: 'https://pl29095318.profitablecpmratenetwork.com/a04663584ae11535d7fc5ddcfb2d6369/invoke.js',
    height: '250px', // Estimated height for native
  },
  '300x250': {
    key: '60a4917dd6e16ae80930604cd36e7fe8',
    format: 'iframe',
    height: 250,
    width: 300,
    src: 'https://www.highperformanceformat.com/60a4917dd6e16ae80930604cd36e7fe8/invoke.js',
  },
  '320x50': {
    key: '1520f34c2e68071b70e519749ddcaf9c',
    format: 'iframe',
    height: 50,
    width: 320,
    src: 'https://www.highperformanceformat.com/1520f34c2e68071b70e519749ddcaf9c/invoke.js',
  },
};

export default function AdUnit({ type }: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = AD_CONFIGS[type];

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing content to avoid duplicates on re-renders
    containerRef.current.innerHTML = '';

    if (type === 'native') {
      const script = document.createElement('script');
      script.async = true;
      script.src = config.src;
      script.setAttribute('data-cfasync', 'false');

      const adDiv = document.createElement('div');
      adDiv.id = (config as any).id;

      containerRef.current.appendChild(script);
      containerRef.current.appendChild(adDiv);
    } else {
      // Banner ads (300x250, 320x50)
      const bannerConfig = config as any;
      
      const scriptConfig = document.createElement('script');
      scriptConfig.innerHTML = `
        atOptions = {
          'key' : '${bannerConfig.key}',
          'format' : '${bannerConfig.format}',
          'height' : ${bannerConfig.height},
          'width' : ${bannerConfig.width},
          'params' : {}
        };
      `;

      const scriptInvoke = document.createElement('script');
      scriptInvoke.src = bannerConfig.src;

      containerRef.current.appendChild(scriptConfig);
      containerRef.current.appendChild(scriptInvoke);
    }
  }, [type, config]);

  return (
    <div className="flex justify-center items-center w-full my-6 overflow-hidden">
        <div 
          ref={containerRef} 
          style={{ 
            minHeight: typeof config.height === 'number' ? `${config.height}px` : config.height,
            width: (config as any).width ? `${(config as any).width}px` : '100%',
          }}
          className="mx-auto"
        />
    </div>
  );
}
