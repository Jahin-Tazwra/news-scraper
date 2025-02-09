const app = require("express")();
const puppeteer = require("puppeteer");

// Custom delay function
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

app.get("/api/:ticker", async (req, res) => {
  let options = {
    headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    slowMo: 100,
  };

  const ticker = req.params.ticker;

  
  try {
      
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    await page.goto(`https://finance.yahoo.com/quote/${ticker}/news`);

    // Wait for the target element to load
    const selector = "#nimbus-app > section > section > section > article > section.mainContent.yf-tnbau3 > section";
    await page.waitForSelector(selector, {timeout: 1000000});

    // Scroll 5 times to load more content, waiting 2 seconds between each scroll
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(2000);
    }

    // After scrolling, select the element again
    const element = await page.$(selector);

    // Extract the element's outer HTML
    const elementHtml = await page.evaluate(el => el.outerHTML, element);

    // Return the HTML of the selected element
    res.send(elementHtml);

    await browser.close();
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while scraping the page.");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;