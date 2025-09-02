const express = require("express");
const OSS = require("ali-oss");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// 配置阿里云OSS客户端
const client = new OSS({
  region: "oss-cn-beijing",
  accessKeyId: "你的AccessKeyId",
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

const headers = {
  // 指定Object的存储类型。
  "x-oss-storage-class": "Standard",
  // 指定Object的访问权限。
  "x-oss-object-acl": "private",
  // 通过文件URL访问文件时，指定以附件形式下载文件，下载后的文件名称定义为example.txt。
  "Content-Disposition": 'attachment; filename="example.txt"',
  // 设置Object的标签，可同时设置多个标签。
  "x-oss-tagging": "Tag1=1&Tag2=2",
  // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
  "x-oss-forbid-overwrite": "true",
};

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
// 列出文件
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
