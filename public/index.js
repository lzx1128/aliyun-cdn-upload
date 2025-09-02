new Vue({
  el: "#app",
  data() {
    return {
      selectedFiles: [],
      fileList: [],
      statusMessage: "",
      statusType: "success",
      isUploading: false,
      isDragging: false,
    };
  },
  mounted() {
    this.listFiles();
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.addFiles(files);
    },

    handleDragEnter() {
      this.isDragging = true;
    },

    handleDragOver() {
      this.isDragging = true;
    },

    handleDragLeave() {
      this.isDragging = false;
    },

    handleDrop(event) {
      this.isDragging = false;
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    },

    addFiles(files) {
      files.forEach((file) => {
        // 检查文件是否已存在
        const exists = this.selectedFiles.some(
          (selectedFile) =>
            selectedFile.name === file.name && selectedFile.size === file.size
        );

        if (!exists) {
          this.selectedFiles.push(file);
        }
      });
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    // 新增：清空已选择的文件
    clearSelectedFiles() {
      this.selectedFiles = [];
      this.$refs.fileInput.value = "";
    },

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

    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    async uploadFiles() {
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

    uploadSingleFile(file) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        // 上传进度监听
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
          }
        });

        // 请求完成处理
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

        // 请求错误处理
        xhr.addEventListener("error", () => {
          reject(new Error("网络错误"));
        });

        xhr.open("POST", "http://localhost:3000/upload");
        xhr.send(formData);
      });
    },

    async listFiles() {
      try {
        const response = await fetch("http://localhost:3000/listFiles");
        const data = await response.json();

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

    async deleteFile(fileName) {
      if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) {
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/deleteFileByName", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName: fileName }),
        });

        const result = await response.json();

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
