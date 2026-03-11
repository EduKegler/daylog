module.exports = {
  ci: {
    collect: {
      url: [process.env.LHCI_URL || "https://daylog.app/login"],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "csp-xss": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
