const http = require("http");
const app = require("./app");
const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT || 4000;

// server listening
server.listen(4000, () => {
  console.log(`Server running on port ${4000}`);
});
