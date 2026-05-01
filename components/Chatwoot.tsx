import Script from 'next/script';
import { useEffect } from 'react';

type ChatwootProps = {};

function Chatwoot(props: ChatwootProps) {
  return (
    <>
      <style jsx>
        {`
          .branding--link {
            display: none;
          }
        `}
      </style>
      <Script>
        {`
(function(d,t) {
  var BASE_URL="https://messages.digitallync.ai";
  var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
  g.src=BASE_URL+"/packs/js/sdk.js";
  g.defer = true;
  g.async = true;
  s.parentNode.insertBefore(g,s);
  g.onload=function(){
    window.chatwootSDK.run({
      websiteToken: 'cB7HjR36g93w7NB6igo7uMMX',
      baseUrl: BASE_URL
    })
  }
})(document,"script");
      `}
      </Script>
    </>
  );
}

export default Chatwoot;
