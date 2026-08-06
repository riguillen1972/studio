import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'focus-audio';
const AUDIO_DIR = '/Users/Lio/Documents/studybuddyaimusic';

async function main() {
  console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }
  
  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`Creating bucket '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }
    console.log("Bucket created successfully.");
  } else {
    console.log(`Bucket '${BUCKET_NAME}' already exists. Making sure it's public...`);
    await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
  }
  
  console.log("Reading audio files...");
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.wav'));
  console.log(`Found ${files.length} WAV files to upload.`);
  
  for (const file of files) {
    const filePath = path.join(AUDIO_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const destPath = `tracks/${file}`;
    
    console.log(`Uploading ${file} to ${destPath}...`);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(destPath, fileBuffer, {
      contentType: 'audio/wav',
      upsert: true
    });
    
    if (error) {
      console.error(`Failed to upload ${file}:`, error.message);
    } else {
      console.log(`Successfully uploaded ${file}`);
    }
  }
  
  console.log("All done!");
}

main().catch(console.error);
