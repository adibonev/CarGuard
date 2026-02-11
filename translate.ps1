# Translation Script for CarGuard - Bulgarian to English
# This script replaces all Bulgarian text with English in the client source files

$replacements = @{
    # Common UI Elements
    'Автомобили' = 'Vehicles'
    'Общо събития' = 'Total Events'
    'Изтичащи скоро' = 'Expiring Soon'
    'Общо разходи' = 'Total Costs'
    'Добави първия си автомобил' = 'Add your first vehicle'
    'Започни да следиш сроковете на застраховки и винетки' = 'Start tracking insurance and vignette deadlines'
    'Добави автомобил' = 'Add Vehicle'
    'Изтекъл!' = 'Expired!'
    ' дни' = ' days'
    ' лв' = ' BGN'
    
    # Tabs
    'Табло' = 'Dashboard'
    'Автомобилите Ми' = 'My Vehicles'
    'Услуги' = 'Services'
    'Документи' = 'Documents'
    'Настройки' = 'Settings'
    
    # Buttons
    'Изход' = 'Logout'
    'Редактирай' = 'Edit'
    'Изтрий' = 'Delete'
    'Запази' = 'Save'
    'Откажи' = 'Cancel'
    'Затвори' = 'Close'
    'Добави' = 'Add'
    'Качи' = 'Upload'
    'Изтегли' = 'Download'
    'Виж' = 'View'
    
    # Service Types (Old Keys)
    'гражданска' = 'civil_liability'
    'винетка' = 'vignette'
    'преглед' = 'inspection'
    'каско' = 'casco'
    'данък' = 'tax'
    'пожарогасител' = 'fire_extinguisher'
    'ремонт' = 'repair'
    'обслужване' = 'maintenance'
    'гуми' = 'tires'
    'зареждане' = 'refuel'
    'друго' = 'other'
    
    # Service Type Names
    'Гражданска отговорност' = 'Civil Liability Insurance'
    'Гражданска застраховка' = 'Civil Liability'
    'Гражданска' = 'Civil Liability'
    'Винетка' = 'Vignette'
    'Технически преглед' = 'Technical Inspection'
    'КАСКО' = 'CASCO'
    'Данък МПС' = 'Vehicle Tax'
    'Данък' = 'Tax'
    'Заверка на пожарогасител' = 'Fire Extinguisher Check'
    'Пожарогасител' = 'Fire Extinguisher'
    'Ремонт' = 'Repair'
    'Обслужване' = 'Maintenance'
    'Добавяне на гуми' = 'Tire Change'
    'Зареждане' = 'Refuel'
    'Друго' = 'Other'
    
    # Months
    'Януари' = 'January'
    'Февруари' = 'February'
    'Март' = 'March'
    'Април' = 'April'
    'Май' = 'May'
    'Юни' = 'June'
    'Юли' = 'July'
    'Август' = 'August'
    'Септември' = 'September'
    'Октомври' = 'October'
    'Ноември' = 'November'
    'Декември' = 'December'
    
    # Time units
    'месеца' = 'months'
    'месец' = 'month'
    'години' = 'years'
    'година' = 'year'
    
    # Messages and Labels
    'Моля изберете автомобил' = 'Please select a vehicle'
    'Моля изберете файл' = 'Please select a file'
    'Всички' = 'All'
    'Всички разходи' = 'All Costs'
    'Сигурен ли си, че искаш да изтриеш този автомобил?' = 'Are you sure you want to delete this vehicle?'
    'Сигурен ли си, че искаш да изтриеш тази услуга?' = 'Are you sure you want to delete this service?'
    'Сигурен ли си, че искаш да изтриеш този документ?' = 'Are you sure you want to delete this document?'
    'Грешка при качване на файла' = 'Error uploading file'
    'Грешка при добавяне на услуга' = 'Error adding service'
    'Грешка при качване на документ' = 'Error uploading document'
    'Грешка при изтриване на документ' = 'Error deleting document'
    'Грешка при генериране на PDF' = 'Error generating PDF'
    'Грешка при актуализиране на напомянията' = 'Error updating reminders'
    'Документът е качен успешно!' = 'Document uploaded successfully!'
    'Документът е изтрит успешно!' = 'Document deleted successfully!'
    'Качен документ' = 'Uploaded document'
    'Календар с предстоящи събития' = 'Calendar with upcoming events'
}

# Files to process
$files = @(
    "client\src\pages\Dashboard.js"
)

foreach ($file in $files) {
    $filePath = Join-Path (Get-Location) $file
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        
        $changeCount = 0
        foreach ($key in $replacements.Keys) {
            $value = $replacements[$key]
            $oldContent = $content
            $content = $content -replace [regex]::Escape($key), $value
            if ($oldContent -ne $content) {
                $changeCount++
            }
        }
        
        Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Made $changeCount replacements" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nTranslation complete!" -ForegroundColor Green
