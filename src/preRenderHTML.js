import React, { Fragment } from 'react';
import { Minimatch } from "minimatch";
import flattenDeep from "lodash.flattendeep";
import minimatch from "minimatch";
import { interpolate } from './utils';

const ampBoilerplate = `body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`;
const ampNoscriptBoilerplate = `body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`;

export const onPreRenderHTML = (
  {
    getHeadComponents,
    replaceHeadComponents,
    getPreBodyComponents,
    replacePreBodyComponents,
    getPostBodyComponents,
    replacePostBodyComponents,
    pathname
  },
  {
    analytics,
    stories,
    canonicalBaseUrl,
    components = [],
    includedPaths = [],
    excludedPaths = [],
    pathIdentifier = "/amp/",
    relAmpHtmlPattern = "{{canonicalBaseUrl}}{{pathname}}{{pathIdentifier}}"
  }
) => {
  const headComponents = flattenDeep(getHeadComponents());
  const preBodyComponents = getPreBodyComponents();
  const postBodyComponents = getPostBodyComponents();
  const isAmp = pathname && pathname.indexOf(pathIdentifier) > -1;
  if (isAmp) {
    const styles = headComponents.reduce((str, x) => {
      if (x.type === "style") {
        if (x.props.dangerouslySetInnerHTML) {
          str += x.props.dangerouslySetInnerHTML.__html;
        }
      } else if (x.key && x.key === "TypographyStyle") {
        str = `${x.props.typography.toString()}${str}`;
      }
      return str;
    }, "");

    replaceHeadComponents([
      <script async src="https://cdn.ampproject.org/v0.js" />,
      <style
        amp-boilerplate=""
        dangerouslySetInnerHTML={{ __html: ampBoilerplate }}
      />,
      <noscript>
        <style
          amp-boilerplate=""
          dangerouslySetInnerHTML={{ __html: ampNoscriptBoilerplate }}
        />
      </noscript>,
      <style amp-custom="" dangerouslySetInnerHTML={{ __html: styles }} />,
      ...components.map((component, i) => (
        <script
          key={`custom-element-${i}`}
          async
          custom-element={`${
            typeof component === "string" ? component : component.name
          }`}
          src={`https://cdn.ampproject.org/v0/${
            typeof component === "string" ? component : component.name
          }-${typeof component === "string" ? "0.1" : component.version}.js`}
        />
      )),
      analytics !== undefined ? (
        <script
          async
          custom-element="amp-analytics"
          src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"
        />
      ) : (
        <Fragment />
      ),
      stories !== undefined ? (
        <script
          async
          custom-element="amp-story"
          src="https://cdn.ampproject.org/v0/amp-story-1.0.js"
        />
      ) : (
        <Fragment />
      ),
      ...headComponents.filter(
        x =>
          x.type !== "style" &&
          (x.type !== "script" || x.props.type === "application/ld+json") &&
          x.key !== "TypographyStyle" &&
          !(
            x.type === "link" &&
            x.props.rel === "preload" &&
            (x.props.as === "script" || x.props.as === "fetch")
          )
      )
    ]);
    replacePreBodyComponents([
      ...preBodyComponents.filter(x => x.key !== "plugin-google-tagmanager")
    ]);
    replacePostBodyComponents(
      postBodyComponents.filter(x => x.type !== "script")
    );
  } else if (
    (excludedPaths.length > 0 &&
      pathname &&
      excludedPaths.findIndex(_path => new Minimatch(pathname).match(_path)) <
        0) ||
    (includedPaths.length > 0 &&
      pathname &&
      includedPaths.findIndex(_path => minimatch(pathname, _path)) > -1) ||
    (excludedPaths.length === 0 && includedPaths.length === 0)
  ) {
    replaceHeadComponents([
      <link
        rel="amphtml"
        key="gatsby-plugin-amp-amphtml-link"
        href={interpolate(relAmpHtmlPattern, {
          canonicalBaseUrl,
          pathIdentifier,
          pathname
        }).replace(/([^:])(\/\/+)/g, "$1/")}
      />,
      ...headComponents
    ]);
  }
}
