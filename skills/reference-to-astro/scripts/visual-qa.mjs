#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const cwd = process.cwd();

function arg(name, fallback) {
  const index =
    process.argv.indexOf(`--${name}`);

  return index === -1
    ? fallback
    : process.argv[index + 1];
}

const profileFile =
  arg("profile", "QA_PROFILE.json");

const outputDir =
  path.resolve(
    cwd,
    arg("out", "qa/screenshots")
  );

async function readJson(file) {
  return JSON.parse(
    await fs.readFile(
      path.resolve(cwd, file),
      "utf8"
    )
  );
}

function safe(value) {
  return value
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function ensureFonts(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
}

async function settle(page, ms = 250) {
  await ensureFonts(page);
  await page.waitForTimeout(ms);
}

async function performStep(page, step) {
  switch (step.action) {
    case "click":
      await page
        .locator(step.selector)
        .click();
      break;

    case "hover":
      await page
        .locator(step.selector)
        .hover();
      break;

    case "focus":
      await page
        .locator(step.selector)
        .focus();
      break;

    case "press":
      await page.keyboard.press(step.key);
      break;

    case "wait":
      await page.waitForTimeout(
        step.ms || 0
      );
      break;

    case "waitForSelector":
      await page
        .locator(step.selector)
        .waitFor({
          state: step.state || "visible",
          timeout: step.timeout || 5000
        });
      break;

    case "scrollIntoView":
      await page
        .locator(step.selector)
        .scrollIntoViewIfNeeded();
      break;

    case "scrollBy":
      await page.evaluate(
        ({ x, y }) => {
          window.scrollBy({
            left: x || 0,
            top: y || 0,
            behavior: "instant"
          });
        },
        {
          x: step.x || 0,
          y: step.y || 0
        }
      );
      break;

    case "scrollTo":
      await page.evaluate(
        ({ x, y }) => {
          window.scrollTo({
            left: x || 0,
            top: y || 0,
            behavior: "instant"
          });
        },
        {
          x: step.x || 0,
          y: step.y || 0
        }
      );
      break;

    case "pointerMove":
      await page.mouse.move(
        step.x || 0,
        step.y || 0,
        { steps: step.steps || 10 }
      );
      break;

    case "mouseDown":
      await page.mouse.down();
      break;

    case "mouseUp":
      await page.mouse.up();
      break;

    case "reload":
      await page.reload({
        waitUntil: "networkidle"
      });
      break;

    default:
      throw new Error(
        `Unknown QA action: ${step.action}`
      );
  }
}

function routeById(profile, id) {
  return profile.routes.find(
    (route) => route.id === id
  );
}

function viewportById(profile, id) {
  return profile.viewports.find(
    (viewport) => viewport.id === id
  );
}

async function captureBaseline({
  browser,
  profile,
  viewport,
  route,
  report,
  reducedMotion = "no-preference"
}) {
  const context =
    await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      reducedMotion
    });

  const page =
    await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(
        message.text()
      );
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const url =
    new URL(
      route.path,
      profile.base_url
    ).toString();

  await page.goto(url, {
    waitUntil: "networkidle"
  });

  await settle(page);

  const suffix =
    reducedMotion === "reduce"
      ? "-reduced-motion"
      : "";

  const filename =
    `${safe(route.id)}--${safe(viewport.id)}${suffix}.png`;

  const destination =
    path.join(outputDir, filename);

  await page.screenshot({
    path: destination,
    fullPage: true
  });

  report.captures.push({
    kind: "baseline",
    route: route.id,
    viewport: viewport.id,
    reduced_motion: reducedMotion,
    file: destination
  });

  for (const error of consoleErrors) {
    report.console_errors.push({
      route: route.id,
      viewport: viewport.id,
      error
    });
  }

  for (const error of pageErrors) {
    report.page_errors.push({
      route: route.id,
      viewport: viewport.id,
      error
    });
  }

  await context.close();
}

async function captureInteraction({
  browser,
  profile,
  interaction,
  viewport,
  report
}) {
  const route =
    routeById(
      profile,
      interaction.route
    );

  if (!route) {
    throw new Error(
      `Unknown route '${interaction.route}'`
    );
  }

  const context =
    await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      }
    });

  const page =
    await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(
        message.text()
      );
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const url =
    new URL(
      route.path,
      profile.base_url
    ).toString();

  await page.goto(url, {
    waitUntil: "networkidle"
  });

  await settle(page);

  const beforeFile =
    path.join(
      outputDir,
      `${safe(interaction.id)}--${safe(viewport.id)}--before.png`
    );

  await page.screenshot({
    path: beforeFile,
    fullPage: false
  });

  for (const step of interaction.steps || []) {
    await performStep(page, step);
  }

  await settle(page, 100);

  const afterFile =
    path.join(
      outputDir,
      `${safe(interaction.id)}--${safe(viewport.id)}--after.png`
    );

  await page.screenshot({
    path: afterFile,
    fullPage: false
  });

  report.captures.push({
    kind: "interaction",
    id: interaction.id,
    route: route.id,
    viewport: viewport.id,
    before: beforeFile,
    after: afterFile
  });

  for (const error of consoleErrors) {
    report.console_errors.push({
      interaction: interaction.id,
      viewport: viewport.id,
      error
    });
  }

  for (const error of pageErrors) {
    report.page_errors.push({
      interaction: interaction.id,
      viewport: viewport.id,
      error
    });
  }

  await context.close();
}

async function main() {
  const profile =
    await readJson(profileFile);

  await fs.mkdir(
    outputDir,
    { recursive: true }
  );

  const browser =
    await chromium.launch({
      headless: true
    });

  const report = {
    timestamp:
      new Date().toISOString(),
    base_url:
      profile.base_url,
    captures: [],
    console_errors: [],
    page_errors: [],
    failures: []
  };

  try {
    for (
      const viewport
      of profile.viewports
    ) {
      for (
        const route
        of profile.routes
      ) {
        try {
          await captureBaseline({
            browser,
            profile,
            viewport,
            route,
            report
          });
        } catch (error) {
          report.failures.push({
            type: "baseline",
            route: route.id,
            viewport: viewport.id,
            error: error.message
          });
        }
      }
    }

    for (
      const interaction
      of profile.interactions || []
    ) {
      for (
        const viewportId
        of interaction.viewports || []
      ) {
        const viewport =
          viewportById(
            profile,
            viewportId
          );

        if (!viewport) {
          report.failures.push({
            type: "interaction",
            interaction:
              interaction.id,
            error:
              `Unknown viewport '${viewportId}'`
          });

          continue;
        }

        try {
          await captureInteraction({
            browser,
            profile,
            interaction,
            viewport,
            report
          });
        } catch (error) {
          report.failures.push({
            type: "interaction",
            interaction:
              interaction.id,
            viewport: viewportId,
            error: error.message
          });
        }
      }
    }

    const mobile =
      profile.viewports.find(
        (viewport) =>
          viewport.id === "mobile"
      ) ||
      profile.viewports[
        profile.viewports.length - 1
      ];

    const home =
      profile.routes[0];

    if (mobile && home) {
      try {
        await captureBaseline({
          browser,
          profile,
          viewport: mobile,
          route: home,
          report,
          reducedMotion: "reduce"
        });
      } catch (error) {
        report.failures.push({
          type: "reduced-motion",
          error: error.message
        });
      }
    }
  } finally {
    await browser.close();
  }

  const reportPath =
    path.resolve(
      cwd,
      "qa/visual-qa-report.json"
    );

  await fs.mkdir(
    path.dirname(reportPath),
    { recursive: true }
  );

  await fs.writeFile(
    reportPath,
    JSON.stringify(report, null, 2)
  );

  console.log(
    `QA captures: ${report.captures.length}`
  );

  console.log(
    `Console errors: ${report.console_errors.length}`
  );

  console.log(
    `Page errors: ${report.page_errors.length}`
  );

  console.log(
    `Capture failures: ${report.failures.length}`
  );

  console.log(`Report: ${reportPath}`);

  if (
    report.page_errors.length ||
    report.failures.length
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    error.stack || error.message
  );

  process.exitCode = 1;
});
