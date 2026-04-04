import { defineE2ECoverage } from "@ingot/prospect";

const testId = {
  counter: {
    buttonIncrement: "counter-increment",
    buttonReset: "counter-reset",
  },
  form: {
    inputName: "form-input-name",
    buttonSubmit: "form-button-submit",
  },
  links: {
    linkGithub: "link-github",
    linkDocs: "link-docs",
  },
} as const;

const e2e = defineE2ECoverage({
  testId,
  routes: {
    "/": {
      interactions: {
        [testId.counter.buttonIncrement]: [{ expected: "increments the counter", test: "tests/example.e2e.ts" }],
        [testId.counter.buttonReset]: [{ expected: "resets the counter to 0", test: "tests/example.e2e.ts" }],
        [testId.form.inputName]: [{ expected: "accepts text input", test: null }],
        [testId.form.buttonSubmit]: [
          { context: "with name", expected: "shows alert greeting", test: null },
          { context: "empty name", expected: "shows alert with empty name", test: null },
        ],
        [testId.links.linkGithub]: [{ expected: "navigates to GitHub repo", test: null }],
        [testId.links.linkDocs]: [{ expected: "navigates to docs", test: null }],
      },
    },
  },
});

export const { routes } = e2e;
export { testId };
