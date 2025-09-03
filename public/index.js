// 创建Vue实例
new Vue({
  // 挂载到id为app的元素上
  el: "#app",
  
  // 数据属性
  data() {
    return {
      // 已选择待上传的文件列表
      selectedFiles: [],
      // 服务器上的文件列表
      fileList: [],
      // 状态消息内容
      statusMessage: "",
      // 状态消息类型（success或error）
      statusType: "success",
      // 是否正在上传文件
      isUploading: false,
      // 是否正在拖拽文件
      isDragging: false,
      // 网络文件URL（用于从URL上传）
      networkFileUrl: "",
      // 网络文件保存名称（可选）
      networkFileName: "",
    };
  },
  
  // 实例挂载完成后执行
  mounted() {
    // 初始化时获取文件列表
    this.listFiles();
  },
  
  // 方法定义
  methods: {
    // 触发文件选择框
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // 处理文件选择事件
    handleFileSelect(event) {
      // 将FileList转换为数组
      const files = Array.from(event.target.files);
      // 添加文件到待上传列表
      this.addFiles(files);
    },

    // 处理拖拽进入事件
    handleDragEnter() {
      this.isDragging = true;
    },

    // 处理拖拽悬停事件
    handleDragOver() {
      this.isDragging = true;
    },

    // 处理拖拽离开事件
    handleDragLeave() {
      this.isDragging = false;
    },

    // 处理文件拖拽放下事件
    handleDrop(event) {
      this.isDragging = false;
      // 获取拖拽的文件列表
      const files = Array.from(event.dataTransfer.files);
      // 添加文件到待上传列表
      this.addFiles(files);
    },

    // 添加文件到待上传列表
    addFiles(files) {
      files.forEach((file) => {
        // 检查文件是否已存在于待上传列表中
        const exists = this.selectedFiles.some(
          (selectedFile) =>
            selectedFile.name === file.name && selectedFile.size === file.size
        );

        // 如果文件不存在，则添加到列表
        if (!exists) {
          this.selectedFiles.push(file);
        }
      });
    },

    // 从待上传列表中移除文件
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    // 清空已选择的文件
    clearSelectedFiles() {
      this.selectedFiles = [];
      // 清空文件输入框的值
      this.$refs.fileInput.value = "";
    },

    // 根据文件类型获取对应的图标类名
    getFileIcon(fileType) {
      if (!fileType) return "fa-file";

      // 标准化文件类型为小写
      const type = fileType.toLowerCase();

      // 图片文件
      if (
        type.includes("image") ||
        type.includes("jpg") ||
        type.includes("jpeg") ||
        type.includes("png") ||
        type.includes("gif") ||
        type.includes("bmp") ||
        type.includes("svg")
      ) {
        return "fa-file-image";
      }

      // 文档文件
      if (type.includes("pdf")) return "fa-file-pdf";
      if (
        type.includes("word") ||
        type.includes("doc") ||
        type.includes("docx")
      )
        return "fa-file-word";
      if (
        type.includes("excel") ||
        type.includes("xls") ||
        type.includes("xlsx")
      )
        return "fa-file-excel";
      if (
        type.includes("powerpoint") ||
        type.includes("ppt") ||
        type.includes("pptx")
      )
        return "fa-file-powerpoint";

      // 压缩文件
      if (
        type.includes("zip") ||
        type.includes("rar") ||
        type.includes("7z") ||
        type.includes("tar")
      ) {
        return "fa-file-archive";
      }

      // 音频文件
      if (
        type.includes("audio") ||
        type.includes("mp3") ||
        type.includes("wav") ||
        type.includes("ogg") ||
        type.includes("flac")
      ) {
        return "fa-file-audio";
      }

      // 视频文件
      if (
        type.includes("video") ||
        type.includes("mp4") ||
        type.includes("avi") ||
        type.includes("mov") ||
        type.includes("mkv")
      ) {
        return "fa-file-video";
      }

      // 代码文件
      if (
        type.includes("text") ||
        type.includes("javascript") ||
        type.includes("js") ||
        type.includes("css") ||
        type.includes("html") ||
        type.includes("xml") ||
        type.includes("json") ||
        type.includes("php") ||
        type.includes("py") ||
        type.includes("java") ||
        type.includes("cpp") ||
        type.includes("c")
      ) {
        return "fa-file-code";
      }

      // 默认返回通用文件图标
      return "fa-file";
    },

    // 从文件名获取文件类型（扩展名）
    getFileType(filename) {
      if (!filename) return "unknown";

      // 获取文件扩展名
      const parts = filename.split(".");

      // 如果没有扩展名或文件名以点结尾
      if (parts.length < 2 || parts[parts.length - 1] === "") {
        return "unknown";
      }

      // 返回最后一个部分作为扩展名（转换为小写）
      return parts[parts.length - 1].toLowerCase();
    },

    // 格式化文件大小显示
    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    // 批量上传文件
    async uploadFiles() {
      // 检查是否有文件需要上传
      if (this.selectedFiles.length === 0) {
        this.showStatusMessage("请至少选择一个文件上传", "error");
        return;
      }

      this.isUploading = true;

      try {
        // 逐个上传文件
        for (let i = 0; i < this.selectedFiles.length; i++) {
          await this.uploadSingleFile(this.selectedFiles[i]);
        }

        this.showStatusMessage("所有文件上传成功！", "success");
        this.selectedFiles = [];
        this.listFiles(); // 刷新文件列表
      } catch (error) {
        console.error("上传过程中发生错误:", error);
        this.showStatusMessage("上传过程中发生错误: " + error.message, "error");
      } finally {
        this.isUploading = false;
      }
    },

    // 上传单个文件
    uploadSingleFile(file) {
      return new Promise((resolve, reject) => {
        // 创建FormData对象
        const formData = new FormData();
        formData.append("file", file);

        // 创建XMLHttpRequest对象
        const xhr = new XMLHttpRequest();

        // 监听上传进度
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            // 计算上传进度百分比
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            // 这里可以更新进度条显示
          }
        });

        // 监听请求完成事件
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.url) {
              resolve(response);
            } else {
              reject(new Error(response.message || "上传失败"));
            }
          } else {
            reject(new Error("上传失败"));
          }
        });

        // 监听请求错误事件
        xhr.addEventListener("error", () => {
          reject(new Error("网络错误"));
        });

        // 发送上传请求
        xhr.open("POST", "http://localhost:3000/upload");
        xhr.send(formData);
      });
    },
    
    // 下载文件
    async downloadFile(fileName) {
      try {
        // 构造下载链接
        const downloadUrl = `http://localhost:3000/download/${encodeURIComponent(fileName)}`;
        
        // 创建一个隐藏的 a 标签来触发下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        
        // 添加到页面并触发点击
        document.body.appendChild(link);
        link.click();
        
        // 清理 DOM
        document.body.removeChild(link);
        
        // 显示下载开始提示
        this.statusMessage = `开始下载文件: ${fileName}`;
        this.statusType = 'success';
        
        // 3秒后清除提示
        setTimeout(() => {
          this.statusMessage = '';
        }, 3000);
      } catch (error) {
        console.error('下载文件时出错:', error);
        this.statusMessage = `下载文件失败: ${error.message}`;
        this.statusType = 'error';
        
        setTimeout(() => {
          this.statusMessage = '';
        }, 3000);
      }
    },
    
    // 从URL上传文件
    async uploadFromUrl() {
      // 检查URL是否已填写
      if (!this.networkFileUrl) {
        this.showStatusMessage("请输入文件URL", "error");
        return;
      }

      this.isUploading = true;

      try {
        // 发送上传请求
        const response = await fetch("http://localhost:3000/uploadFromUrl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: this.networkFileUrl,
            fileName: this.networkFileName || undefined,
          }),
        });

        const result = await response.json();

        // 处理上传结果
        if (response.ok) {
          this.showStatusMessage("文件上传成功！", "success");
          this.clearNetworkUrl();
          this.listFiles(); // 刷新文件列表
        } else {
          throw new Error(result.message || "上传失败");
        }
      } catch (error) {
        console.error("上传过程中发生错误:", error);
        this.showStatusMessage("上传过程中发生错误: " + error.message, "error");
      } finally {
        this.isUploading = false;
      }
    },
    
    // 清空网络URL上传的输入框
    clearNetworkUrl() {
      this.networkFileUrl = "";
      this.networkFileName = "";
    },
    
    // 获取文件列表
    async listFiles() {
      try {
        // 发送获取文件列表请求
        const response = await fetch("http://localhost:3000/listFiles");
        const data = await response.json();

        // 更新文件列表
        if (data.files) {
          this.fileList = data.files;
        } else {
          this.showStatusMessage("获取文件列表失败", "error");
        }
      } catch (error) {
        console.error("获取文件列表时发生错误:", error);
        this.showStatusMessage("获取文件列表时发生错误", "error");
      }
    },

    // 删除文件
    async deleteFile(fileName) {
      // 确认删除操作
      if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) {
        return;
      }

      try {
        // 发送删除请求
        const response = await fetch("http://localhost:3000/deleteFileByName", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName: fileName }),
        });

        const result = await response.json();

        // 处理删除结果
        if (result.success) {
          this.showStatusMessage("文件删除成功", "success");
          this.listFiles(); // 刷新文件列表
        } else {
          this.showStatusMessage("删除失败: " + result.message, "error");
        }
      } catch (error) {
        console.error("删除文件失败:", error);
        this.showStatusMessage("删除过程中发生错误", "error");
      }
    },
    
    // 显示状态消息
    showStatusMessage(message, type) {
      this.statusMessage = message;
      this.statusType = type;

      // 3秒后自动清除消息
      setTimeout(() => {
        this.statusMessage = "";
      }, 3000);
    },
  },
});