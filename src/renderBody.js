import React, { Fragment } from 'react';

import { interpolate } from './utils';

export const renderBody = (
  { setHeadComponents, setHtmlAttributes, setPreBodyComponents, pathname },
  {
    analytics,
    canonicalBaseUrl,
    pathIdentifier = "/amp/",
    relCanonicalPattern = "{{canonicalBaseUrl}}{{pathname}}",
    useAmpClientIdApi = false
  }
) => {
  const isAmp = pathname && pathname.indexOf(pathIdentifier) > -1;
  if (isAmp) {
    setHtmlAttributes({ amp: "" });
    setHeadComponents([
      <link
        rel="canonical"
        href={interpolate(relCanonicalPattern, {
          canonicalBaseUrl,
          pathname
        })
          .replace(pathIdentifier, "")
          .replace(/([^:])(\/\/+)/g, "$1/")}
      />,
      useAmpClientIdApi ? (
        <meta name="amp-google-client-id-api" content="googleanalytics" />
      ) : (
        <Fragment />
      )
    ]);
    setPreBodyComponents([
      analytics != undefined ? (
        <amp-analytics
          type={analytics.type}
          data-credentials={analytics.dataCredentials}
          config={
            typeof analytics.config === "string" ? analytics.config : undefined
          }
        >
          {typeof analytics.config === "string" ? (
            <Fragment />
          ) : (
            <script
              type="application/json"
              dangerouslySetInnerHTML={{
                __html: interpolate(JSON.stringify(analytics.config), {
                  pathname
                })
              }}
            />
          )}
        </amp-analytics>
      ) : (
        <Fragment />
      )
    ]);
  }
}
