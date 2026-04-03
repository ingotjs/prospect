import { useState } from "react";

import { CoverageOverlay } from "@ingot/prospect/overlay";

import { routes } from "../coverage.ts";

export function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h1>Prospect Playground</h1>
      <p>A minimal app for testing the Prospect dev overlay.</p>

      <section style={{ marginTop: 24 }}>
        <h2>Counter</h2>
        <p>Count: {count}</p>
        <button data-testid="counter-increment" onClick={() => setCount((c) => c + 1)} type="button">
          Increment
        </button>
        <button data-testid="counter-reset" onClick={() => setCount(0)} type="button" style={{ marginLeft: 8 }}>
          Reset
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Form</h2>
        <label htmlFor="name-input">Name</label>
        <br />
        <input
          id="name-input"
          data-testid="form-input-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <br />
        <button data-testid="form-button-submit" onClick={() => alert(`Hello, ${name}!`)} type="button" style={{ marginTop: 8 }}>
          Submit
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Links</h2>
        <a data-testid="link-github" href="https://github.com/ingotjs/prospect">
          GitHub
        </a>
        {" | "}
        <a data-testid="link-docs" href="#">
          Docs
        </a>
      </section>

      <CoverageOverlay coverage={routes} />
    </div>
  );
}
