$stocks = Get-Content .\STOCK_DAY_ALL.json -Encoding utf8 | ConvertFrom-Json
$stocks | ForEach-Object {
    $stock = $_
    $stock | ForEach-Object {
        $stockData = $_
        $stockData | Select-Object -Property Code, Name, ClosingPrice
    }
} | ConvertTo-Csv -NoTypeInformation