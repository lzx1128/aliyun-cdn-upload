const OSS = require('ali-oss');

// 使用您在server.js中相同的配置
const client = new OSS({
  region: "oss-cn-beijing",
  accessKeyId: "你的AccessKeyId",
  accessKeySecret: "你的AccessKeySecret",
  bucket: "你的Bucket名称",
  secure: true,
  timeout: "60s",
});

async function testPermissions() {
  console.log('开始测试OSS权限...');
  
  try {
    // 1. 测试列出文件权限
    console.log('1. 测试列出文件权限...');
    const listResult = await client.list({ 'max-keys': 5 });
    console.log('✅ 列出文件权限正常');
    console.log('文件数量:', listResult.objects ? listResult.objects.length : 0);
    
    // 2. 测试上传权限（创建一个测试文件）
    console.log('\n2. 测试上传权限...');
    const testContent = 'This is a test file for permission testing';
    const testFileName = `test/test-permission-${Date.now()}.txt`;
    
    const putResult = await client.put(testFileName, Buffer.from(testContent));
    console.log('✅ 上传权限正常');
    console.log('上传文件名:', putResult.name);
    
    // 3. 测试删除权限
    console.log('\n3. 测试删除权限...');
    const deleteResult = await client.delete(testFileName);
    console.log('✅ 删除权限正常');
    console.log('删除状态码:', deleteResult.res.status);
    
    console.log('\n🎉 所有权限测试通过！');
    
  } catch (error) {
    console.error('❌ 权限测试失败:');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    
    // 根据错误代码判断具体问题
    if (error.code === 'AccessDenied') {
      console.error('\n🔐 权限被拒绝，请检查RAM用户权限配置');
    } else if (error.code === 'NoSuchBucket') {
      console.error('\n📁 Bucket不存在，请检查bucket名称');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('\n🔑 AccessKey ID无效，请检查AccessKey配置');
    }
  }
}

// 运行测试
testPermissions();