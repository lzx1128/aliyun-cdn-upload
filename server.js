const express = require("express");
const OSS = require("ali-oss");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const urllib = require("urllib");
// const Duplex = require("stream").Duplex;
// // 实例化双工流。
// let stream = new Duplex();

// 配置阿里云OSS客户端
const client = new OSS({
  region: "oss-cn-beijing",
  accessKeyId: "你的AccessKeyID",
  accessKeySecret: "你的AccessKeySecret",
  bucket: "你的Bucket名称",
  secure: true,
  timeout: "60s",
});

// 使用 CORS 中间件，允许所有来源访问
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // 支持表单数据

// 配置 multer 上传文件的存储方式（临时存储到 uploads 文件夹）
const upload = multer({ dest: "uploads/" });
// 上传接口
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "没有上传文件" });
    }

    const ossFileName = `uploads/${Date.now()}_${file.originalname}`; // OSS 文件名
    const localFilePath = path.resolve(file.path); // 本地临时文件路径

    console.log(`开始上传: ${ossFileName}`);

    const result = await client.put(ossFileName, localFilePath, {
      headers: {
        "x-oss-storage-class": "Standard",
        "x-oss-object-acl": "private",
        "x-oss-forbid-overwrite": "true",
      },
    });

    // 上传成功后，删除本地临时文件
    fs.unlinkSync(localFilePath);

    res.json({
      message: "上传成功",
      url: result.url, // OSS 文件访问地址
      name: result.name,
    });
  } catch (err) {
    console.error("上传失败:", err);
    res.status(500).json({ message: "上传失败", error: err.message });
  }
});
// 上传网络文件到 OSS
app.post("/uploadFromUrl", async (req, res) => {
  try {
    const { url, fileName } = req.body;

    // 参数验证
    if (!url) {
      return res.status(400).json({ message: "URL是必需的" });
    }

    // 如果没有提供文件名，则从URL中提取
    let ossFileName = fileName;
    if (!ossFileName) {
      ossFileName = `uploads/${Date.now()}_${path.basename(url)}`;
    }

    // 获取网络文件流
    const { res: readStream } = await urllib.request(url, {
      streaming: true, // 返回 stream
    });

    // 上传到 OSS
    const result = await client.putStream(ossFileName, readStream, {
      headers: {
        "x-oss-storage-class": "Standard",
        "x-oss-object-acl": "private",
        "x-oss-forbid-overwrite": "true",
      },
    });

    res.json({
      message: "上传成功",
      url: result.url,
      name: result.name,
    });
  } catch (err) {
    console.error("上传失败:", err);
    res.status(500).json({ message: "上传失败", error: err.message });
  }
});
// 下载文件接口
// 服务器代理下载接口（可选添加）
app.get('/download/:fileName', async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.fileName);
    
    // 通过流的方式直接传输文件
    const result = await client.getStream(fileName);
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 将 OSS 流直接传输到客户端响应
    result.stream.pipe(res);
  } catch (error) {
    console.error('OSS 下载失败:', error);
    if (error.code === 'NoSuchKey') {
      res.status(404).json({ error: '文件不存在' });
    } else {
      res.status(500).json({ error: '从 OSS 下载文件失败', message: error.message });
    }
  }
});

// 文件列表
app.get("/listFiles", async (req, res) => {
  try {
    const result = await client.list({ "max-keys": 100 });
    const files = result.objects.map((file) => ({
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    }));
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch file list" });
  }
});

// 删除指定的多个文件
app.delete("/deleteFileByName", async (req, res) => {
  try {
    const { fileName } = req.body;

    // 参数验证
    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid request: fileName is required",
      });
    }

    // 执行删除操作
    const result = await client.delete(fileName);

    // 返回结果
    res.json({
      success: true,
      message: `File ${fileName} deleted successfully`,
      result: result,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      message: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server started on port 3000");
});
