import React from 'react';
import { Helmet } from 'react-helmet-async';

interface GoogleAnalyticsProps {
  measurementId: string;
  enableGTM?: boolean;
  gtmId?: string;
  enableEnhancedEcommerce?: boolean;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({
  measurementId,
  enableGTM = false,
  gtmId,
  enableEnhancedEcommerce = true
}) => {
  const gtag = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    
    gtag('config', '${measurementId}', {
      page_title: document.title,
      page_location: window.location.href,
      ${enableEnhancedEcommerce ? `
      custom_map: {
        'custom_parameter': 'dimension1'
      },
      enhanced_ecommerce: true,
      ` : ''}
    });
    
    // Track Core Web Vitals
    function sendToGoogleAnalytics({name, delta, value, id}) {
      gtag('event', name, {
        event_category: 'Web Vitals',
        event_label: id,
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        non_interaction: true,
      });
    }
    
    // Import and use web-vitals library if available
    if (typeof webVitals !== 'undefined') {
      webVitals.getCLS(sendToGoogleAnalytics);
      webVitals.getFID(sendToGoogleAnalytics);
      webVitals.getFCP(sendToGoogleAnalytics);
      webVitals.getLCP(sendToGoogleAnalytics);
      webVitals.getTTFB(sendToGoogleAnalytics);
    }
    
    // Track menu interactions
    function trackMenuInteraction(action, itemName, category) {
      gtag('event', action, {
        event_category: 'Menu Interaction',
        event_label: itemName,
        custom_parameter: category
      });
    }
    
    // Track order events
    function trackOrderEvent(action, orderId, value, items) {
      gtag('event', action, {
        event_category: 'Ecommerce',
        transaction_id: orderId,
        value: value,
        currency: 'USD',
        items: items
      });
    }
    
    // Make functions globally available
    window.trackMenuInteraction = trackMenuInteraction;
    window.trackOrderEvent = trackOrderEvent;
  `;

  const gtmScript = gtmId ? `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  ` : '';

  return (
    <Helmet>
      {/* Google Analytics 4 */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <script>{gtag}</script>
      
      {/* Google Tag Manager */}
      {enableGTM && gtmId && (
        <script>{gtmScript}</script>
      )}
      
      {/* Web Vitals Library */}
      <script
        async
        src="https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js"
      />
      
      {/* Preconnect to Google services */}
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* GTM NoScript fallback */}
      {enableGTM && gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      )}
    </Helmet>
  );
};

export default GoogleAnalytics;
