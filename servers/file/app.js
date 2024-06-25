const http = require("http");
const path = require("path");
const busboy = require("busboy");
const fs = require("fs");
const express = require("express");

const app = express();
const basePath = path.join(__dirname, 'files')
app.use("/file", express.static(path.join(__dirname, "./files")));
app.get("/*", (req, res) => {
  console.log(req.path)
  const subPath = req.path || '/'
  const dir = path.join(basePath, subPath)
  let data = {}
  let stat
  try {
    stat = fs.statSync(dir)
  } catch (error) {
    res.status(404)
    res.send(`@${req.path} not exists`)
    return
  }
  if (stat.isFile()) {
    console.log(`download dir`)
    return res.download(dir)
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(dir).map(e => {
      const fpath = path.join(dir, e)
      if (fs.statSync(fpath).isFile()) {
        return {
          path: path.join(subPath, e),
          file: true,
          name: e
        }
      }
      return {
        path: path.join(subPath, e),
        name: e
      }
    })
    let str = `
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="filefield"><br />
        <input type="submit">
      </form>
    `


    str += '<li>-代表目录，文件可以点击下载'
    if(subPath!=='/'){
      str+= `
      <ul>
          <a href='../'>..</a>
        </ul>
      `
    }
    files.filter(e => e.file).forEach(e => {
      str += `
        <ul>
          <a href=${e.path}>${e.name}</a>
        </ul>
      `
    })
    str += ``
    files.filter(e => !e.file).forEach(e => {
      str += `
        <ul>
         -  <a href=${e.path}>${e.name}</a>
        </ul>
      `
    })
    str += `</li>`
    res.send(str)
    return
  }
  res.json(data)
});

app.post("/*", (req, res) => {
  const bb = busboy({ headers: req.headers });
  let fileName = "";
  let folder = path.join(basePath, req.path);
  try {
    const stat = fs.statSync(folder)
    if(!stat.isDirectory()){
      res.status(400)
      res.send(`${req.path} not valid folder`)
      return
    }
  } catch (error) {
    fs.mkdirSync(folder)
    // 
  }
  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(info);
    fileName = `${Date.now()}-${filename}`;
    const saveTo = path.join(folder, fileName)
    console.log(`save to ${saveTo}`)
    file.pipe(fs.createWriteStream(saveTo));
  });
  bb.on("close", () => {
    res.redirect(req.path)
  });
  req.pipe(bb);
});
http
  .createServer((req, res) => {
    app(req, res);
  })
  .listen(8700, "0.0.0.0", () => {
    console.log("Listening for requests");
  });
