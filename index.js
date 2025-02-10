const app = require("express")();

const main = require("./test");

app.get("/api/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const data = await main(ticker);
  res.send(data);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;