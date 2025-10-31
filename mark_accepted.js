// 脚本：批量标记LinkedIn链接为accepted
// 使用方法：在浏览器控制台中运行此脚本

// 用户提供的需要标记为accepted的LinkedIn链接列表
const acceptedLinkedInUrls = [
  // Series A
  'https://www.linkedin.com/in/animesh-koratana/',
  'https://www.linkedin.com/in/eric-ciarla/',
  'https://www.linkedin.com/in/divyaanshumakkar/',
  'https://www.linkedin.com/in/stacyedgar/',
  'https://www.linkedin.com/in/emily-long-7a194b4',
  'https://www.linkedin.com/in/parkerence',
  'https://www.linkedin.com/in/coltoncalandrella',
  'https://www.linkedin.com/in/macliu1/',
  'https://www.linkedin.com/in/lukearrigoni',
  'https://www.linkedin.com/in/varun-puri001',
  'https://www.linkedin.com/in/joseph-rutakangwa',
  'https://www.linkedin.com/in/aneesh-dhawan-140212141',
  'https://www.linkedin.com/in/jaspar-carmichael-jack',
  
  // Series Seed
  'https://www.linkedin.com/in/rajsekhark/',
  'https://www.linkedin.com/in/ahmed-rashad-perle',
  'https://www.linkedin.com/in/jugal-anchalia-0a2ab220',
  'https://www.linkedin.com/in/priyanshabagaria',
  'https://www.linkedin.com/in/stamirowska',
  'https://www.linkedin.com/in/sal-rehmetullah-59704741',
  'https://www.linkedin.com/in/dovyoran',
  'https://www.linkedin.com/in/drishanarora',
  'https://www.linkedin.com/in/rickyarora',
  'https://www.linkedin.com/in/williamjunchenwu',
  'https://www.linkedin.com/in/shawn-shen-jx',
  'https://www.linkedin.com/in/kristian-kamber-b4b05a68',
  'https://www.linkedin.com/in/roshankumars',
  'https://www.linkedin.com/in/waleedatallah/',
  'https://www.linkedin.com/in/natmon',
  'https://www.linkedin.com/in/lindon-gao',
  'https://www.linkedin.com/in/edrizio-de-la-cruz',
  'https://www.linkedin.com/in/bellis',
  'https://www.linkedin.com/in/pulkitjaiswal',
  'https://www.linkedin.com/in/matthew-vega-sanz',
  'https://www.linkedin.com/in/mishal-thadani',
  
  // Seed Stage VC
  'https://www.linkedin.com/in/jonathanabrams',
  'https://www.linkedin.com/in/mike-collins-362100',
  'https://www.linkedin.com/in/franziska-bossart-b3799153',
  'https://www.linkedin.com/in/hannahchelkowski',
  'https://www.linkedin.com/in/neerajgupta123',
  'https://www.linkedin.com/in/davidongchoco',
  'https://www.linkedin.com/in/daynagrayson',
  'https://www.linkedin.com/in/hadleyharris',
  'https://www.linkedin.com/in/heikkilajesse',
  'https://www.linkedin.com/in/luzhangvc',
  'https://www.linkedin.com/in/rktaparia',
  'https://il.linkedin.com/in/yuvalpassov',
  'https://www.linkedin.com/in/maxaltschuler',
  'https://www.linkedin.com/in/david-stark-36bb1938/',
  'https://www.linkedin.com/in/mauricio-porras-837995105',
  'https://www.linkedin.com/in/gregfrick',
  'https://ae.linkedin.com/in/hervecuviliez',
  'https://www.linkedin.com/in/nathanmcdonald1',
  'https://www.linkedin.com/in/karl-alomar-0516a219',
  'https://www.linkedin.com/in/amir-amidi',
  'https://www.linkedin.com/in/chenxiwang88',
  'https://www.linkedin.com/in/alchuang',
  'https://www.linkedin.com/in/sudeepmishra?trk=org-employees',
  'https://www.linkedin.com/in/ryanfloyd1',
  'https://www.linkedin.com/in/andrew-marks-92429015',
  'https://www.linkedin.com/in/trangnguyen2010?trk=org-employees',
  
  // recent raised series B
  'https://www.linkedin.com/in/nickbonfiglio',
  'https://www.linkedin.com/in/sureshmathew',
  'https://www.linkedin.com/in/thejuliomartinez/',
  'https://www.linkedin.com/in/joniklippert',
  'https://www.linkedin.com/in/khalidraza',
  'https://www.linkedin.com/in/stephenwhitworth/',
  'https://www.linkedin.com/in/yair-kuznitsov/',
  'https://www.linkedin.com/in/colinzima',
  'https://www.linkedin.com/in/maximser',
  'https://www.linkedin.com/in/alexandre-de-vigan-26388015/'
];

// 标准化LinkedIn URL（用于匹配）
function normalizeLinkedInUrl(url) {
  if (!url) return '';
  const urlStr = String(url).trim();
  if (!urlStr.startsWith('http')) return '';
  
  // 移除查询参数和锚点，统一处理末尾斜杠
  try {
    const urlObj = new URL(urlStr);
    let pathname = urlObj.pathname;
    // 统一移除末尾斜杠（除非是根路径）
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    // 注意：LinkedIn URL路径大小写敏感，不要转小写
    return urlObj.origin + pathname;
  } catch {
    // 如果URL解析失败，尝试简单处理
    let cleaned = urlStr.split('?')[0].split('#')[0];
    if (cleaned.endsWith('/') && cleaned !== '/') {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  }
}

// 标记LinkedIn链接为accepted
async function markLinkedInAsAccepted() {
  try {
    // 加载存储
    const storage = JSON.parse(localStorage.getItem('cofina_data_storage') || '{}');
    
    // 标准化所有需要标记的URL
    const normalizedAcceptedUrls = acceptedLinkedInUrls.map(url => normalizeLinkedInUrl(url));
    
    // Sheet名称映射
    const sheetMappings = {
      'Series A': 'Series A',
      'Series Seed': 'Series Seed',
      'Seed Stage VC': 'Seed Stage VC',
      'recent raised series B': 'recent raised series B'
    };
    
    // CSV文件映射
    const csvFiles = {
      "Series A": "/leads - Series A (1).csv",
      "Series Seed": "/leads - Series Seed (2).csv",
      "Seed Stage VC": "/leads - Seed Stage VC (1).csv",
      "recent raised series B": "/leads - recent raised series B (2).csv"
    };
    
    console.log('开始处理...');
    console.log('需要标记的URL数量:', normalizedAcceptedUrls.length);
    
    // 读取所有CSV文件并匹配
    for (const [sheetName, csvPath] of Object.entries(csvFiles)) {
      try {
        console.log(`\n处理 ${sheetName}...`);
        
        const response = await fetch(csvPath);
        if (!response.ok) {
          console.error(`无法读取文件: ${csvPath}`);
          continue;
        }
        
        const text = await response.text();
        
        // 使用更好的CSV解析方法
        const parseCSVLine = (line) => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = i < line.length - 1 ? line[i + 1] : '';
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // 转义的双引号
                current += '"';
                i++; // 跳过下一个引号
              } else {
                // 切换引号状态
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // 添加最后一个值
          return values;
        };
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          console.log(`文件 ${sheetName} 为空`);
          continue;
        }
        
        const headers = parseCSVLine(lines[0]);
        
        // 查找LinkedIn列索引（支持多种列名）
        const linkedInColIndices = [];
        headers.forEach((col, idx) => {
          const lower = col.toLowerCase().trim();
          if ((lower.includes('linkedin') || lower.includes('linkedin url')) && 
              !lower.includes('accepted') && 
              !lower.includes('request')) {
            linkedInColIndices.push(idx);
          }
        });
        
        console.log(`找到LinkedIn列:`, linkedInColIndices.map(i => headers[i]));
        
        if (linkedInColIndices.length === 0) {
          console.log(`在 ${sheetName} 中未找到LinkedIn列`);
          continue;
        }
        
        // 初始化存储
        if (!storage[sheetName]) {
          storage[sheetName] = {};
        }
        if (!storage[sheetName].linkedin_accepted) {
          storage[sheetName].linkedin_accepted = {};
        }
        
        let matchedCount = 0;
        
        // 解析CSV数据（跳过标题行）
        for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
          const line = lines[rowIndex].trim();
          if (!line) continue;
          
          const values = parseCSVLine(line);
          
          // 检查这一行的任何一个LinkedIn列是否匹配
          for (const linkedInColIndex of linkedInColIndices) {
            if (linkedInColIndex < values.length) {
              const rowLinkedIn = (values[linkedInColIndex] || '').trim();
              const normalizedRowLinkedIn = normalizeLinkedInUrl(rowLinkedIn);
              
              if (!normalizedRowLinkedIn) continue;
              
              // 检查是否在需要标记的列表中
              const matched = normalizedAcceptedUrls.some(url => {
                const normalizedAcceptedLinkedIn = normalizeLinkedInUrl(url);
                // 精确匹配规范化的URL（已统一处理末尾斜杠）
                const match = normalizedRowLinkedIn === normalizedAcceptedLinkedIn;
                if (match) {
                  console.log(`匹配: "${normalizedRowLinkedIn}" === "${normalizedAcceptedLinkedIn}"`);
                }
                return match;
              });
              
              if (matched) {
                // 注意：CSV行索引从1开始（0是标题），但数据数组索引从0开始
                // 所以实际数据行索引是 rowIndex - 1
                const dataRowIndex = rowIndex - 1;
                storage[sheetName].linkedin_accepted[dataRowIndex] = true;
                matchedCount++;
                console.log(`✓ 匹配: ${normalizedRowLinkedIn} (CSV行 ${rowIndex}, 数据行 ${dataRowIndex})`);
                break; // 找到一个匹配就退出
              }
            }
          }
        }
        
        console.log(`${sheetName}: 标记了 ${matchedCount} 行`);
      } catch (error) {
        console.error(`处理 ${sheetName} 时出错:`, error);
      }
    }
    
    // 保存到localStorage
    localStorage.setItem('cofina_data_storage', JSON.stringify(storage));
    
    console.log('\n✓ 完成！所有链接已标记为accepted');
    console.log('请刷新页面以查看更新');
    
    return storage;
  } catch (error) {
    console.error('执行失败:', error);
    throw error;
  }
}

// 执行
markLinkedInAsAccepted();

