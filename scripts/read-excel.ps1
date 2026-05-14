$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open("C:\Users\Buffer Laptop\Downloads\Email List - Cases From the Last 15 days to 4-8-2026 - Business.xlsx")
$sheet = $workbook.Sheets.Item(1)

Write-Host "Headers:"
for ($col = 1; $col -le 10; $col++) {
    $val = $sheet.Cells.Item(1, $col).Text
    if ($val) { Write-Host "Column $col : $val" }
}

Write-Host ""
Write-Host "First 5 data rows:"
for ($row = 2; $row -le 6; $row++) {
    $line = ""
    for ($col = 1; $col -le 5; $col++) {
        $val = $sheet.Cells.Item($row, $col).Text
        $line += "[$val] "
    }
    Write-Host "Row $row : $line"
}

Write-Host ""
$lastRow = $sheet.UsedRange.Rows.Count
Write-Host "Total rows (including header): $lastRow"

$workbook.Close($false)
$excel.Quit()
