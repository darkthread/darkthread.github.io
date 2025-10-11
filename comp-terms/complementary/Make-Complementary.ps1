
# 读取 wiki-source.txt 文件
$wikiContent = Get-Content -Path "wiki-source.txt" -Encoding UTF8

# 解析 Wiki 表格
$list = @()
$i = 0

while ($i -lt $wikiContent.Count) {
    $line = $wikiContent[$i].Trim()
    
    # 跳过表头和空行
    if ($line -match '^!' -or $line -match '^\{\|' -or $line -eq '' -or $line -eq '|}') {
        $i++
        continue
    }
    
    # 跳过分隔符（单独的 |-）
    if ($line -eq '|-') {
        $i++
        continue
    }
    
    # 检查是否是 rowspan 行
    if ($line -match '^\|\s*rowspan="(\d+)"\s*\|') {
        $rowspan = [int]$Matches[1]
        # 提取 English 术语
        $en = $line -replace '^\|\s*rowspan="\d+"\s*\|\s*', '' -replace '^\s*|\s*$', ''
        
        # 读取接下来的 rowspan 组（每组是 tw, cn, |-）
        for ($j = 0; $j -lt $rowspan; $j++) {
            $i++
            if ($i -lt $wikiContent.Count) {
                $twLine = $wikiContent[$i].Trim()
                if ($twLine -match '^\|') {
                    $tw = $twLine -replace '^\|\s*', '' -replace '<br\s*/?\s*>', '；'
                    
                    $i++
                    if ($i -lt $wikiContent.Count) {
                        $cnLine = $wikiContent[$i].Trim()
                        if ($cnLine -match '^\|') {
                            $cn = $cnLine -replace '^\|\s*', '' -replace '<br\s*/?\s*>', '；'
                            
                            $list += [PSCustomObject]@{
                                en = $en
                                tw = $tw
                                cn = $cn
                            }
                            
                            # 读取并跳过分隔符 |-（如果不是最后一组）
                            $i++
                            if ($i -lt $wikiContent.Count -and $wikiContent[$i].Trim() -eq '|-') {
                                # 已经跳过了
                            }
                            else {
                                # 回退一步，因为不是分隔符
                                $i--
                            }
                        }
                    }
                }
            }
        }
        $i++
    }
    # 普通行：连续三行为一组（en, tw, cn）
    elseif ($line -match '^\|') {
        $en = $line -replace '^\|\s*', '' -replace '<br\s*/?\s*>', '；'
        
        $i++
        if ($i -lt $wikiContent.Count) {
            $twLine = $wikiContent[$i].Trim()
            if ($twLine -match '^\|') {
                $tw = $twLine -replace '^\|\s*', '' -replace '<br\s*/?\s*>', '；'
                
                $i++
                if ($i -lt $wikiContent.Count) {
                    $cnLine = $wikiContent[$i].Trim()
                    if ($cnLine -match '^\|') {
                        $cn = $cnLine -replace '^\|\s*', '' -replace '<br\s*/?\s*>', '；'
                        
                        $list += [PSCustomObject]@{
                            en = $en
                            tw = $tw
                            cn = $cn
                        }
                        $i++
                        continue
                    }
                }
            }
        }
    }
    else {
        $i++
    }
}

# 输出为指定格式
$list | ForEach-Object {
    # 转义单引号
    $en = $_.en -replace "'", "''"
    $tw = $_.tw -replace "'", "''"
    $cn = $_.cn -replace "'", "''"
    
    "Item('$en', 'zh-tw:$tw; zh-cn:$cn;'),"
} | Out-file -FilePath "..\wiki\complementary.txt" -Encoding UTF8