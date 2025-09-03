# 文件上传服务 (server.js)

## 依赖项

-   **Express.js**: Web 应用框架\
-   **ali-oss**: 阿里云 OSS SDK\
-   **multer**: 文件上传中间件\
-   **cors**: 跨域资源共享处理


## 主要功能

### OSS 配置

``` javascript
const client = new OSS({
  region: "oss-cn-beijing",
  accessKeyId: "你的AccessKeyId",
  accessKeySecret: "你的AccessKeySecret",
  bucket: "你的Bucket名称",
  secure: true,
  timeout: "60s",
});
```

⚠️ **注意**: 请勿在生产环境中硬编码 `accessKeyId` 和
`accessKeySecret`，应使用环境变量存储。



## API 端点

### `POST /upload`

上传文件到 OSS。
请求体需包含 `file` 字段。

### `POST /uploadFromUrl`

上传网络文件到 OSS

### `GET /listFiles`

获取 OSS 文件列表。

### `GET /download/:fileName`

下载 OSS文件。

### `DELETE /deleteFileByName`

根据文件名删除 OSS 文件。



## 服务启动

``` bash
node server.js
```

服务器将在 <http://localhost:3000> 启动。



# OSS 权限测试脚本

此脚本用于验证阿里云 OSS 的权限配置是否正确，包括
**列出文件、上传文件、删除文件** 三个操作。
1.  将 `testPermissions.js` 脚本放在与 `server.js` 同级目录下。
2.  在命令行中运行：

``` bash
node testPermissions.js
```
## 输出结果示例

``` bash
开始测试OSS权限...
1. 测试列出文件权限...
✅ 列出文件权限正常
文件数量: 3

2. 测试上传权限...
✅ 上传权限正常
上传文件名: test/test-permission-1693562345678.txt

3. 测试删除权限...
✅ 删除权限正常
删除状态码: 204

🎉 所有权限测试通过！
```


