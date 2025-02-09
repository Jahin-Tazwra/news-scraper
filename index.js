const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

// Custom delay function
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

app.get("/api/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const options = {
    headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-gpu",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  };

  try {
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    await page.goto(`https://finance.yahoo.com/quote/${ticker}/news`, {
      waitUntil: "networkidle2",
      timeout: 50000
    });

    const selector =
      "#nimbus-app > section > section > section > article > section.mainContent.yf-tnbau3 > section";
    await page.waitForSelector(selector, { timeout: 50000 });

    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(2000);
    }

    const element = await page.$(selector);
    const elementHtml = await page.evaluate(
      (el) => el?.outerHTML || "",
      element
    );

    res.send(elementHtml);
    await browser.close();
  } catch (err) {
    console.error("Error occurred:", err);
    res.status(500).send("An error occurred while scraping the page.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

module.exports = app;