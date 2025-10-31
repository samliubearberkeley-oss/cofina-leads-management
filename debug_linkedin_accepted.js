// 调试脚本：检查为什么linkedin accepted没有打钩
// 在浏览器控制台运行：checkLinkedInAcceptedStatus()

async function checkLinkedInAcceptedStatus() {
  console.log('=== 检查LinkedIn Accepted状态 ===\n');
  
  // 1. 检查localStorage
  const storage = JSON.parse(localStorage.getItem('cofina_data_storage') || '{}');
  console.log('1. localStorage内容:');
  console.log(storage);
  
  const sheets = ['Series A', 'Series Seed', 'Seed Stage VC', 'recent raised series B'];
  sheets.forEach(sheetName => {
    if (storage[sheetName] && storage[sheetName].linkedin_accepted) {
      const linkedinAccepted = storage[sheetName].linkedin_accepted;
      const count = Object.keys(linkedinAccepted).filter(k => linkedinAccepted[k] === true).length;
      console.log(`\n${sheetName}: ${count} 个链接已标记`);
      console.log('标记的行索引:', Object.keys(linkedinAccepted).filter(k => linkedinAccepted[k] === true));
    } else {
      console.log(`\n${sheetName}: 没有linkedin_accepted数据`);
    }
  });
  
  // 2. 检查CSV文件是否能读取
  console.log('\n\n2. 检查CSV文件:');
  const csvFiles = {
    "Series A": "/leads - Series A (1).csv",
    "Series Seed": "/leads - Series Seed (2).csv",
    "Seed Stage VC": "/leads - Seed Stage VC (1).csv",
    "recent raised series B": "/leads - recent raised series B (2).csv"
  };
  
  for (const [sheetName, csvPath] of Object.entries(csvFiles)) {
    try {
      const response = await fetch(csvPath);
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim());
        console.log(`✓ ${sheetName}: 成功读取，共 ${lines.length} 行`);
        
        // 检查第一行是否有LinkedIn列
        if (lines.length > 0) {
          const headers = lines[0].split(',');
          const linkedInCols = headers.filter((h, i) => {
            const lower = h.toLowerCase();
            return lower.includes('linkedin') && !lower.includes('accepted') && !lower.includes('request');
          });
          console.log(`  LinkedIn列: ${linkedInCols.join(', ')}`);
        }
      } else {
        console.log(`✗ ${sheetName}: 无法读取文件 ${csvPath} (状态码: ${response.status})`);
      }
    } catch (error) {
      console.log(`✗ ${sheetName}: 读取错误 - ${error.message}`);
    }
  }
  
  // 3. 检查应用数据加载
  console.log('\n\n3. 检查应用数据加载状态:');
  console.log('请检查浏览器控制台是否有以下日志:');
  console.log('- "LinkedIn Accepted URLs: X"');
  console.log('- "Sheet X LinkedIn columns: [...]"');
  console.log('- "Sheet X: X rows matched"');
  
  // 4. 测试一个具体的URL匹配
  console.log('\n\n4. 测试URL匹配:');
  const testUrl1 = 'https://www.linkedin.com/in/animesh-koratana/';
  const testUrl2 = 'https://www.linkedin.com/in/animesh-koratana';
  
  function normalizeTest(url) {
    if (!url) return '';
    const urlStr = String(url).trim();
    if (!urlStr.startsWith('http')) return '';
    try {
      const urlObj = new URL(urlStr);
      let pathname = urlObj.pathname;
      if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      return urlObj.origin + pathname;
    } catch {
      let cleaned = urlStr.split('?')[0].split('#')[0];
      if (cleaned.endsWith('/') && cleaned !== '/') {
        cleaned = cleaned.slice(0, -1);
      }
      return cleaned;
    }
  }
  
  const norm1 = normalizeTest(testUrl1);
  const norm2 = normalizeTest(testUrl2);
  console.log(`URL1: "${testUrl1}" -> "${norm1}"`);
  console.log(`URL2: "${testUrl2}" -> "${norm2}"`);
  console.log(`匹配: ${norm1 === norm2}`);
  
  console.log('\n\n=== 检查完成 ===');
  console.log('如果localStorage中有数据但页面没有显示，请：');
  console.log('1. 刷新页面');
  console.log('2. 检查浏览器控制台是否有错误');
  console.log('3. 确认CSV文件路径正确');
}

// 自动运行
checkLinkedInAcceptedStatus();

