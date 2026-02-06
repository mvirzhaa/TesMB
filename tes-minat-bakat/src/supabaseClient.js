// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ragwscluznomxjbsqdsq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZ3dzY2x1em5vbXhqYnNxZHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODAzMjAsImV4cCI6MjA4NTg1NjMyMH0.b9O53spS3xIkN7tngwYiKqRzjvfADlhGV52Vh6fPOAI'

export const supabase = createClient(supabaseUrl, supabaseKey)