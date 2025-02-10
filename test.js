const puppeteer = require("puppeteer");

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
  

async function scrapVideo(url) {
  const browser = await puppeteer.launch({
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
        : puppeteer.executablePath()
  });
  const page = await browser.newPage();
  await page.goto(url, {timeout: 1000000});

  try {
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

    return elementHtml;
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
}


async function main(ticker) {
  try {
    const data = await scrapVideo(`https://finance.yahoo.com/quote/${ticker}/news`);
    return data;
  } catch (err) {
    console.log(err);
  }
}

module.exports = main;