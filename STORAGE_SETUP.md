# Supabase Storage Setup

## Създаване на Storage Bucket за документи

За да работи функционалността за качване на файлове, трябва да създадеш Storage bucket в Supabase:

### Стъпки:

1. Отвори **Supabase Dashboard**: https://app.supabase.com
2. Избери проекта си: `lytoaknjphiirxxyzohd`
3. От лявото меню избери **Storage**
4. Кликни на **Create a new bucket**
5. Въведи следните настройки:
   - **Name**: `documents`
   - **Public bucket**: ✅ (отметни)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/jpg,image/png,image/webp`

6. Кликни **Create bucket**

### Настройка на Policies (RLS):

След създаването на bucket-а, трябва да добавиш правила за достъп:

#### 1. Upload Policy:
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 2. Read Policy (Public):
```sql
CREATE POLICY "Files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

#### 3. Delete Policy:
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
