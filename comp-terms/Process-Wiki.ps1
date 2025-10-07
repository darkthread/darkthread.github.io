# Item('radio-frequency identification', 'zh-cn:射频识别; zh-tw:無線射頻辨識; zh-hk:無線射頻辨識; zh-sg:射频识别;'),
$stats = @{}
$list = @()
Get-ChildItem .\wiki\*.txt | ForEach-Object {
    Get-Content -Path $_.FullName -Encoding utf8 | ForEach-Object {
        if ($_ -match "Item\('([^']+)', '([^']+)'\),") {
            $term = @{}
            $term.en = $matches[1]
            # if ($matches[2].Contains('=>')) {
            #     return
            # }
            $matches[2] -split ';' | ForEach-Object {
                if ($_ -match "(\w+-\w+):(.+)") {
                    $lang = $matches[1].Trim()
                    $text = $matches[2].Trim()
                    if (-not $stats.ContainsKey($lang)) {
                        $stats[$lang] = 0
                    }
                    $stats[$lang]++
                    $term[$lang.Split('-')[1]] = $text
                }
            }
            $list += $term
        }
    } 
}
#$list | Sort-Object en | ConvertTo-Json
$cols = @('en', 'tw', 'cn', 'hk', 'sg', 'hant', 'hans', 'mo', 'my')
$union = ($list | Sort-Object en | Select-Object $cols)
# group by 'en' and merge
$grouped = $union | Group-Object -Property en | ForEach-Object {
    $obj = @{ en = $_.Name }
    foreach ($col in $cols) {
        $obj[$col] = ($_.Group | ForEach-Object { $_.$col } | Where-Object { $_ } | Select-Object -Unique) -join ';'
    }
    [PSCustomObject]$obj
}

$csv = ($grouped | Sort-Object en | Select-Object $cols | ConvertTo-Csv -NoTypeInformation -Delimiter "`t") -replace '"', ''
$csv | Set-Content -Path terms.csv -Encoding utf8

Write-Host $stats