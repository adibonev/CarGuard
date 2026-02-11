-- Supabase Storage Policies за 'documents' bucket
-- Изпълни този SQL в Supabase SQL Editor

-- 1. Изтрий стари policies (ако има такива)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- 2. Създай нови policies за documents bucket

-- Policy за четене (всички могат да виждат файловете)
CREATE POLICY "Public can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy за качване (само автентикирани потребители)
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy за обновяване (само автентикирани потребители)
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Policy за изтриване (само автентикирани потребители)
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- ГОТОВО! Сега качването на файлове трябва да работи.
