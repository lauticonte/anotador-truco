import React from "react";
import packageInfo from "../../package.json";

const Footer = () => {
  return (
    <div className="footer">
      <span className="footer__copy">
        <p>&#169; Copyright {new Date().getFullYear()}{" "}</p>
      </span>
      <span className="footer__title">
        <a
          href="https://contelautaro.com.ar"
          target="_blank"
          rel="noreferrer"
        >
          Conte
        </a>
      </span>
      <span className="footer__version">
        <p>versión {packageInfo.version} 🚀</p>
      </span>
    </div>
  );
};

export default Footer;
