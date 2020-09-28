import React, { Fragment } from 'react';
import { renderToString } from "react-dom/server";
import { JSDOM } from 'jsdom';

export const replaceRenderer = (
  { bodyComponent, replaceBodyHTMLString, setHeadComponents, pathname },
  { pathIdentifier = "/amp/" }
) => {
  const defaults = {
    image: {
      width: 640,
      height: 475,
      layout: "responsive"
    },
    twitter: {
      width: "390",
      height: "330",
      layout: "responsive"
    },
    iframe: {
      width: 640,
      height: 475,
      layout: "responsive"
    }
  };
  const headComponents = [];
  const isAmp = pathname && pathname.indexOf(pathIdentifier) > -1;
  if (isAmp) {
    const bodyHTML = renderToString(bodyComponent);
    const dom = new JSDOM(bodyHTML);
    const document = dom.window.document;

    // convert images to amp-img or amp-anim
    const images = [].slice.call(document.getElementsByTagName("img"));
    images.forEach(image => {
      let ampImage;
      if (image.src && image.src.indexOf(".gif") > -1) {
        ampImage = document.createElement("amp-anim");
        headComponents.push({ name: "amp-anim", version: "0.1" });
      } else {
        ampImage = document.createElement("amp-img");
      }
      const attributes = Object.keys(image.attributes);
      const includedAttributes = attributes.map(key => {
        const attribute = image.attributes[key];
        ampImage.setAttribute(attribute.name, attribute.value);
        return attribute.name;
      });
      Object.keys(defaults.image).forEach(key => {
        if (includedAttributes && includedAttributes.indexOf(key) === -1) {
          ampImage.setAttribute(key, defaults.image[key]);
        }
      });
      image.parentNode.replaceChild(ampImage, image);
    });

    // convert twitter posts to amp-twitter
    const twitterPosts = [].slice.call(
      document.getElementsByClassName("twitter-tweet")
    );
    twitterPosts.forEach(post => {
      headComponents.push({ name: "amp-twitter", version: "0.1" });
      const ampTwitter = document.createElement("amp-twitter");
      const attributes = Object.keys(post.attributes);
      const includedAttributes = attributes.map(key => {
        const attribute = post.attributes[key];
        ampTwitter.setAttribute(attribute.name, attribute.value);
        return attribute.name;
      });
      Object.keys(defaults.twitter).forEach(key => {
        if (includedAttributes && includedAttributes.indexOf(key) === -1) {
          ampTwitter.setAttribute(key, defaults.twitter[key]);
        }
      });
      // grab the last link in the tweet for the twee id
      const links = [].slice.call(post.getElementsByTagName("a"));
      const link = links[links.length - 1];
      const hrefArr = link.href.split("/");
      const id = hrefArr[hrefArr.length - 1].split("?")[0];
      ampTwitter.setAttribute("data-tweetid", id);
      // clone the original blockquote for a placeholder
      const _post = post.cloneNode(true);
      _post.setAttribute("placeholder", "");
      ampTwitter.appendChild(_post);
      post.parentNode.replaceChild(ampTwitter, post);
    });

    // convert iframes to amp-iframe or amp-youtube
    const iframes = [].slice.call(document.getElementsByTagName("iframe"));
    iframes.forEach(iframe => {
      let ampIframe;
      let attributes;
      if (iframe.src && iframe.src.indexOf("youtube.com/embed/") > -1) {
        headComponents.push({ name: "amp-youtube", version: "0.1" });
        ampIframe = document.createElement("amp-youtube");
        const src = iframe.src.split("/");
        const id = src[src.length - 1].split("?")[0];
        ampIframe.setAttribute("data-videoid", id);
        const placeholder = document.createElement("amp-img");
        placeholder.setAttribute(
          "src",
          `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
        );
        placeholder.setAttribute("placeholder", "");
        placeholder.setAttribute("layout", "fill");
        ampIframe.appendChild(placeholder);

        const forbidden = ["allow", "allowfullscreen", "frameborder", "src"];
        attributes = Object.keys(iframe.attributes).filter(key => {
          const attribute = iframe.attributes[key];
          return !forbidden.includes(attribute.name);
        });
      } else {
        headComponents.push({ name: "amp-iframe", version: "0.1" });
        ampIframe = document.createElement("amp-iframe");
        attributes = Object.keys(iframe.attributes);
      }

      const includedAttributes = attributes.map(key => {
        const attribute = iframe.attributes[key];
        ampIframe.setAttribute(attribute.name, attribute.value);
        return attribute.name;
      });
      Object.keys(defaults.iframe).forEach(key => {
        if (includedAttributes && includedAttributes.indexOf(key) === -1) {
          ampIframe.setAttribute(key, defaults.iframe[key]);
        }
      });
      iframe.parentNode.replaceChild(ampIframe, iframe);
    });
    const styleTags = [].slice.call(document.getElementsByTagName("style"));
    styleTags.forEach(styleTag => {
      if (styleTag.getAttribute('data-emotion-css') != null) {
          styleTag.setAttribute('amp-custom', "");
      }
    })
    setHeadComponents(
      Array.from(new Set(headComponents)).map((component, i) => (
        <Fragment key={`head-components-${i}`}>
          <script
            async
            custom-element={component.name}
            src={`https://cdn.ampproject.org/v0/${component.name}-${component.version}.js`}
          />
        </Fragment>
      ))
    );

    function getNonDivParentElement(element) {
      const childElement = element.children[0];

      if (childElement.tagName.toLowerCase() === 'div') {
        return getNonDivParentElement(childElement);
      }

      return childElement;
    }

    replaceBodyHTMLString(getNonDivParentElement(document.body).outerHTML);
  }
}
