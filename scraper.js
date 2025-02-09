const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const path = require("path");
const videosModel = require(path.join(__dirname, "../routes/models/videos"));
require("dotenv").config();

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
        : puppeteer.executablePath(),
    slowMo: 100,
  });
  const page = await browser.newPage();
  await page.goto(url);

  try {
    const vid = [];
    const index = await page.waitForSelector("input[type=number]");
    const pass = await page.waitForSelector("input[type=password]");
    const submit = await page.waitForXPath(
      `//*[@id="app"]/div/div/div[2]/div[1]/div/div[1]/div[3]/span/form/button`
    );
    await index.type(process.env.SCRAPER_USER);
    await pass.type(process.env.SCRAPER_PASSWORD);
    await submit.click();
    await page.waitForNavigation();

    await page.goto("https://sahittyapara.com/record-class");
    await page.waitForNavigation();

    await page.waitForSelector(".v-list", { timeout: 1000000 });
    const href = await page.evaluate(
      () => document.querySelector("#app > div > div.mt-4 > div > div > div > div.col-md-5.order-md-1.col-12.order-0 > div > div > a:nth-child(1)").href
    );
    const newPage = await browser.newPage();
    await newPage.goto(href);
    await newPage.waitForNavigation();

    const iframeElement = await newPage.waitForSelector("#v-player-iframe", {
      timeout: 100000000,
    }); // Replace with the actual selector

    // Access the iframe's content
    const iframe = await iframeElement.contentFrame();

    if (iframe) {
      // Inside the iframe, extract the link
      await iframe.waitForSelector("#movie_player > a", { timeout: 100000 });
      const link = await iframe.evaluate(() => {
        const linkElement = document.querySelector("#movie_player > a");
        return linkElement ? linkElement.href : null;
      });
      vid.push(link);
    } else {
      console.log("Iframe not found.");
    }

    await newPage.close();

    const title = await page.evaluate(
      () => document.querySelector("#app > div > div.mt-4 > div > div > div > div.col-md-5.order-md-1.col-12.order-0 > div > div > a:nth-child(1)").firstChild.innerText
    );
    vid.push(title);

    return vid;
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
}

async function addData(reqData) {
  try {
    if (reqData && Object.keys(reqData).length > 0) {
      // Immediately invoked async function expression
      (async () => {
        if (reqData[0] !== null && reqData[1] !== null) {
          const newVideo = new videosModel({
            title: reqData[1],
            link: reqData[0],
            course: "monoj2",
          });

          try {
            await newVideo.save(); // Make sure to use await here
          } catch (error) {
            console.error(error);
          }
        }
      })(); // Invoke the function immediately
    } else {
      console.log("Empty data");
    }
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  try {
    const data = await scrapVideo(`https://sahittyapara.com/auth/signin`);
    console.log(data);
    await addData(data);
  } catch (err) {
    console.log(err);
  }
}

module.exports = main;
