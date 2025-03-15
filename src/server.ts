import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
export async function startServer(dev: boolean) {
  const port = 56438;
  const app = next({ dev })
  const handle = app.getRequestHandler()

  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl)
    }).listen(port)

    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
      }`
    )
  })
}
console.log(`startServer`);
// await startServer(true);
// node --experimental-strip-types --env-file=.env  src\server.dev.ts --port 54538
