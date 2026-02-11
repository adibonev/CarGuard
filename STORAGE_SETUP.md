# Supabase Storage Setup

## ⚠️ ВАЖНО: Трябва да създадеш Storage Bucket ръчно!

За да работи функционалността за качване на файлове (документи към услуги), **ЗАДЪЛЖИТЕЛНО трябва** да създадеш Storage bucket в Supabase.

### 📋 Стъпки за създаване на bucket:

1. **Отвори Supabase Dashboard**: https://app.supabase.com
2. **Избери проекта си**: `lytoaknjphiirxxyzohd`
3. **От лявото меню избери "Storage"**
4. **Кликни на зелен бутон "New Bucket" или "Create a new bucket"**
5. **Въведи следните настройки**:
   - **Name**: `documents` (точно така, малки букви, без интервали!)
   - **Public bucket**: ✅ **ДА, отметни това!** (иначе файловете няма да се виждат)
   - **File size limit**: `52428800` (това е 50MB в bytes)
   - **Allowed MIME types**: Остави празно или сложи:
     ```
     application/pdf,image/jpeg,image/jpg,image/png,image/webp
     ```

6. **Кликни "Create bucket"** или "Save"

### 🔒 Настройка на Security Policies (RLS):

След създаването на bucket-а, трябва да добавиш правила за достъп. Отиди в **Storage > documents bucket > Policies**:

#### 1. Upload Policy (Потребителите могат да качват файлове):
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 2. Read Policy (Файловете са публично достъпни):
```sql
CREATE POLICY "Files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

#### 3. Delete Policy (Потребителите могат да изтриват своите файлове):
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Структура на файловете:

Файловете ще се съхраняват по следния начин:
```
documents/
  └── service-documents/
      └── {userId}/
          └── {serviceId}_{timestamp}.{extension}
```

Например: `documents/service-documents/123/456_1707654321000.pdf`

### Тестване:

След настройката можеш да:
1. Добавиш ново събитие
2. Прикачиш PDF или снимка
3. Виждаш линк към документа в картата на събитието
4. Кликнеш на линка за да го отвориш в нов таб

### Проверка:

Ако нещо не работи, провери:
- Bucket-ът е публичен (Public bucket = true)
- RLS политиките са създадени правилно
- Файловите формати са разрешени (PDF, JPG, PNG, WEBP)
- Размерът на файла е под 5MB
